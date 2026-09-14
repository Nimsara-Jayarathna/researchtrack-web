import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStateValue } from "@/features/auth/state/authState";
import { supervisorApi } from "../api/supervisorApi";
import type { GitHubRepositoryAccessRequestMemberStatus } from "../types";
import { useGitHubAccessUpdatedQuery } from "./githubAccessUpdated/useGitHubAccessUpdatedQuery";
import { useGitHubAccessUpdatedSummaryState } from "./githubAccessUpdated/useGitHubAccessUpdatedSummaryState";

function toScopeLabel(
  scope: string | null | undefined,
  count: number | null | undefined,
): string {
  if (scope === "SINGLE_REPOSITORY") {
    return "Single repository access";
  }
  if (scope === "MULTIPLE_REPOSITORIES") {
    return `Multiple repositories access${typeof count === "number" ? ` (${count})` : ""}`;
  }
  if (scope === "NO_REPOSITORIES") {
    return "No repositories selected on GitHub";
  }
  return "Repository access updated";
}

export function useGitHubAccessUpdatedPageState() {
  const navigate = useNavigate();
  const authState = useAuthStateValue();

  const { token, projectId, sourceId, flowType, setupStatus, requestId } =
    useGitHubAccessUpdatedQuery();
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [requestedMemberStatus, setRequestedMemberStatus] =
    useState<GitHubRepositoryAccessRequestMemberStatus | null>(null);

  const normalizedSetupStatus = setupStatus.toLowerCase();
  const isRequestedCompletion =
    flowType === "INSTALLATION_REQUESTED" && normalizedSetupStatus === "success";
  const showFailedStatus = normalizedSetupStatus === "failed";

  const { summary, status, title, message, loadSummary } =
    useGitHubAccessUpdatedSummaryState({
      token,
      projectId,
      showFailedStatus,
      skipLoad: isRequestedCompletion,
      api: {
        getPublicGitHubAccessUpdatedSummary:
          supervisorApi.getPublicGitHubAccessUpdatedSummary,
        getProjectGitHubAccessUpdatedSummary:
          supervisorApi.getProjectGitHubAccessUpdatedSummary,
      },
    });

  useEffect(() => {
    let cancelled = false;

    if (
      !isRequestedCompletion ||
      !requestId ||
      authState.user?.role !== "SUPERVISOR"
    ) {
      setRequestedMemberStatus(null);
      return () => {
        cancelled = true;
      };
    }

    void supervisorApi
      .getGitHubRepositoryAccessRequestStatus(requestId)
      .then((data) => {
        if (!cancelled) {
          setRequestedMemberStatus(data);
        }
      })
      .catch(() => {
        // The public success page remains useful to the repository owner even
        // when the current browser is not the original authorized requester.
        if (!cancelled) {
          setRequestedMemberStatus(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authState.user?.role, isRequestedCompletion, requestId]);

  const resolvedProjectId =
    projectId || requestedMemberStatus?.projectId || summary?.projectId || "";

  const onClose =
    status === "loading"
      ? undefined
      : () =>
          navigate(
            resolvedProjectId
              ? `/supervisor/projects/${resolvedProjectId}`
              : "/",
            { replace: true },
          );

  const onRetry =
    status === "error" && (token || projectId)
      ? () => void loadSummary()
      : undefined;

  async function handleConfirmAndContinue() {
    if (isRequestedCompletion) {
      navigate(
        resolvedProjectId
          ? `/supervisor/projects/${resolvedProjectId}?tab=integrations`
          : "/",
        { replace: true },
      );
      return;
    }

    if (!resolvedProjectId) {
      navigate("/", { replace: true });
      return;
    }

    const resolvedSourceId = sourceId || summary?.sourceId || "";
    const resolvedFlowType =
      flowType || summary?.flowType || "INSTALLATION_DIRECT";

    const nextParams = new URLSearchParams();
    nextParams.set("githubSetup", "success");
    nextParams.set("tab", "overview");
    nextParams.set("githubAccessUpdated", "true");
    if (resolvedSourceId) {
      nextParams.set("githubSourceId", resolvedSourceId);
    }
    if (resolvedFlowType) {
      nextParams.set("githubFlow", resolvedFlowType);
    }

    setIsAcknowledging(true);
    navigate(
      `/supervisor/projects/${resolvedProjectId}?${nextParams.toString()}`,
      {
        replace: true,
      },
    );
  }

  const scopeLabel = useMemo(() => {
    if (!summary) return null;
    return toScopeLabel(summary.accessScope, summary.accessibleRepositoryCount);
  }, [summary]);

  return {
    summary,
    status,
    title,
    message,
    isAcknowledging,
    onClose,
    onRetry,
    scopeLabel,
    handleConfirmAndContinue,
    isRequestedCompletion,
    requestedRepositoryFullName: requestedMemberStatus?.repositoryFullName ?? null,
    canReturnToProject: Boolean(resolvedProjectId),
  };
}
