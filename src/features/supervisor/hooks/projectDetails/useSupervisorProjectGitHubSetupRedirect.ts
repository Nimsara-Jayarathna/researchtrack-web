import { useCallback, useEffect, useState } from "react";
import type { SetURLSearchParams } from "react-router-dom";
import {
  parseGitHubSetupRedirect,
  redirectToGitHubOwnerInstall,
} from "../useGitHubSetupFlow";

type RefreshModalControls = {
  showError: (payload: {
    title: string;
    message: string;
    retryAction?: () => void;
  }) => void;
};

type UseSupervisorProjectGitHubSetupRedirectParams = {
  projectId: string | undefined;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  refreshModal: RefreshModalControls;
};

type GitHubSetupFailureCopy = {
  title: string;
  message: string;
};

function getGitHubSetupFailureCopy(
  errorCode: string | null,
): GitHubSetupFailureCopy {
  switch (errorCode) {
    case "cancelled":
      return {
        title: "GitHub connection cancelled",
        message:
          "No GitHub connection was created. You can retry when you are ready.",
      };
    case "missing_installation":
      return {
        title: "GitHub installation incomplete",
        message:
          "GitHub did not return a completed installation. Retry the connection and grant repository access.",
      };
    case "invalid_installation":
      return {
        title: "GitHub access unavailable",
        message:
          "The returned GitHub App installation is no longer available to ResearchTrack. Retry the connection.",
      };
    case "github_unavailable":
      return {
        title: "GitHub is unavailable",
        message:
          "ResearchTrack could not verify the GitHub App installation right now. Please retry shortly.",
      };
    case "installation_identity_mismatch":
      return {
        title: "GitHub installation could not be verified",
        message:
          "The GitHub account could not confirm access to that App installation. Retry and authorize the account that owns or can manage the installation.",
      };
    case "github_authorization_failed":
      return {
        title: "GitHub authorization failed",
        message:
          "ResearchTrack could not complete GitHub identity verification. Start the connection again.",
      };
    case "invalid_callback":
    case "invalid_setup_action":
      return {
        title: "GitHub setup link is invalid",
        message:
          "This GitHub setup return cannot be used. Start a new GitHub connection from the project.",
      };
    default:
      return {
        title: "GitHub setup failed",
        message:
          "GitHub App connection did not complete. Please try connecting again.",
      };
  }
}

export function useSupervisorProjectGitHubSetupRedirect({
  projectId,
  searchParams,
  setSearchParams,
  refreshModal,
}: UseSupervisorProjectGitHubSetupRedirectParams) {
  const [pendingGitHubSourceId, setPendingGitHubSourceId] = useState<
    string | null
  >(null);
  const [pendingGitHubFlowType, setPendingGitHubFlowType] = useState<
    "INSTALLATION_DIRECT" | "INSTALLATION_REQUESTED" | null
  >(null);

  const onPendingGitHubSourceHandled = useCallback(() => {
    setPendingGitHubSourceId(null);
    setPendingGitHubFlowType(null);
  }, []);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    const redirectState = parseGitHubSetupRedirect(searchParams);
    if (!redirectState.setupStatus) {
      return;
    }

    if (redirectState.setupStatus === "success") {
      if (redirectState.sourceId) {
        setPendingGitHubSourceId(redirectState.sourceId);
        setPendingGitHubFlowType(redirectState.flowType);
      }

      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("githubSetup");
      nextParams.delete("installationId");
      nextParams.delete("githubSourceId");
      nextParams.delete("githubFlow");
      nextParams.delete("githubError");
      nextParams.delete("githubAccessUpdated");
      nextParams.set("tab", "integrations");
      setSearchParams(nextParams, { replace: true });
      return;
    }

    if (redirectState.setupStatus === "failed") {
      const failureCopy = getGitHubSetupFailureCopy(redirectState.errorCode);
      refreshModal.showError({
        ...failureCopy,
        retryAction:
          redirectState.flowType === "INSTALLATION_DIRECT"
            ? () => {
                void redirectToGitHubOwnerInstall(projectId);
              }
            : undefined,
      });
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("githubSetup");
      nextParams.delete("installationId");
      nextParams.delete("githubSourceId");
      nextParams.delete("githubFlow");
      nextParams.delete("githubError");
      nextParams.delete("githubAccessUpdated");
      setSearchParams(nextParams, { replace: true });
    }
  }, [projectId, refreshModal, searchParams, setSearchParams]);

  return {
    pendingGitHubSourceId,
    pendingGitHubFlowType,
    onPendingGitHubSourceHandled,
  };
}
