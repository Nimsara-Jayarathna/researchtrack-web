import type {
  ProjectGitHubPullRequest,
  ProjectGitHubPullRequestStatus,
} from "../types";

export type PullRequestDisplayStatus = Exclude<
  ProjectGitHubPullRequestStatus,
  "all"
>;

export function getPullRequestDisplayStatus(
  pullRequest: ProjectGitHubPullRequest,
): PullRequestDisplayStatus {
  if (pullRequest.isMerged) return "merged";
  if (pullRequest.state.toLowerCase() === "closed") return "closed";
  if (pullRequest.isDraft) return "draft";
  return "open";
}

export function getPullRequestLifecycleDate(
  pullRequest: ProjectGitHubPullRequest,
): { label: string; value: string } {
  const status = getPullRequestDisplayStatus(pullRequest);
  if (status === "merged" && pullRequest.mergedAt) {
    return { label: "Merged", value: pullRequest.mergedAt };
  }
  if (status === "closed" && pullRequest.closedAt) {
    return { label: "Closed", value: pullRequest.closedAt };
  }
  return {
    label: status === "draft" ? "Updated" : "Updated",
    value: pullRequest.updatedAt || pullRequest.createdAt,
  };
}

export function getSafeGitHubUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "github.com"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
