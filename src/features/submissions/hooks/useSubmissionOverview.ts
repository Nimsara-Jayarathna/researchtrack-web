import { useCallback, useEffect, useRef, useState } from "react";
import { submissionApi } from "../api/submissionApi";
import type { SubmissionRequirement, SubmissionStatus } from "../types";

export type SubmissionOverviewAnalytics = {
  totalRequirements: number;
  submittedRequirements: number;
  unsubmittedOpen: number;
  pendingReview: number;
  changesRequested: number;
  approved: number;
  rejected: number;
  focusRequirementTitle: string | null;
  focusStatus: SubmissionStatus | "UNSUBMITTED" | null;
};

export type SubmissionOverviewState = {
  analytics: SubmissionOverviewAnalytics | null;
  isLoading: boolean;
  isUnavailable: boolean;
  reload: () => Promise<void>;
};

function buildAnalytics(
  requirements: SubmissionRequirement[],
): SubmissionOverviewAnalytics {
  // Archived requirements are historical records and should not distort the
  // current project-level submission progress shown on Overview.
  const activeRequirements = requirements.filter(
    (requirement) =>
      requirement.status !== "ARCHIVED" &&
      (requirement.status === "OPEN" || requirement.submissionSummary !== null),
  );

  let submittedRequirements = 0;
  let unsubmittedOpen = 0;
  let pendingReview = 0;
  let changesRequested = 0;
  let approved = 0;
  let rejected = 0;

  for (const requirement of activeRequirements) {
    const status = requirement.submissionSummary?.status ?? null;
    if (status) {
      submittedRequirements += 1;
      if (status === "PENDING_REVIEW") pendingReview += 1;
      if (status === "CHANGES_REQUESTED") changesRequested += 1;
      if (status === "APPROVED") approved += 1;
      if (status === "REJECTED") rejected += 1;
    } else if (requirement.status === "OPEN") {
      unsubmittedOpen += 1;
    }
  }

  const changesRequirement = activeRequirements.find(
    (requirement) =>
      requirement.submissionSummary?.status === "CHANGES_REQUESTED",
  );
  const pendingRequirement = activeRequirements.find(
    (requirement) => requirement.submissionSummary?.status === "PENDING_REVIEW",
  );
  const unsubmittedRequirement = activeRequirements.find(
    (requirement) =>
      requirement.status === "OPEN" && !requirement.submissionSummary,
  );

  const focusRequirement =
    changesRequirement ?? pendingRequirement ?? unsubmittedRequirement ?? null;
  const focusStatus = changesRequirement
    ? "CHANGES_REQUESTED"
    : pendingRequirement
      ? "PENDING_REVIEW"
      : unsubmittedRequirement
        ? "UNSUBMITTED"
        : null;

  return {
    totalRequirements: activeRequirements.length,
    submittedRequirements,
    unsubmittedOpen,
    pendingReview,
    changesRequested,
    approved,
    rejected,
    focusRequirementTitle: focusRequirement?.title ?? null,
    focusStatus,
  };
}

export function useSubmissionOverview(
  projectId: string | undefined,
  enabled = true,
): SubmissionOverviewState {
  const [analytics, setAnalytics] =
    useState<SubmissionOverviewAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(projectId && enabled));
  const [isUnavailable, setIsUnavailable] = useState(false);
  const requestVersion = useRef(0);

  const reload = useCallback(async () => {
    if (!projectId || !enabled) return;
    const version = ++requestVersion.current;

    setIsLoading(true);
    setIsUnavailable(false);
    try {
      const requirements = await submissionApi.listRequirements(projectId);
      if (version !== requestVersion.current) return;
      setAnalytics(buildAnalytics(requirements));
    } catch {
      if (version !== requestVersion.current) return;
      setAnalytics(null);
      setIsUnavailable(true);
    } finally {
      if (version === requestVersion.current) {
        setIsLoading(false);
      }
    }
  }, [enabled, projectId]);

  useEffect(() => {
    if (!enabled) {
      requestVersion.current += 1;
      setIsLoading(false);
      return;
    }
    void reload();
    return () => {
      requestVersion.current += 1;
    };
  }, [enabled, reload]);

  return {
    analytics,
    isLoading,
    isUnavailable,
    reload,
  };
}
