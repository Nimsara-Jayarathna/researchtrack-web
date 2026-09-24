export type ProjectGitHubRepositoryPreview = {
  id: string | null;
  name: string;
  url: string;
  defaultBranch: string;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type ProjectGitHubActivitySummary = {
  totalCommits: number;
  totalPullRequests: number;
  openPullRequests: number;
  draftPullRequests: number;
  mergedPullRequests: number;
  closedPullRequests: number;
  lastActivityAt: string | null;
  lastActivityType: "commit" | "pull_request" | null;
  lastActivityPullRequestNumber: number | null;
  lastActivityPullRequestStatus: "OPEN" | "DRAFT" | "MERGED" | "CLOSED" | null;
  status: "active" | "idle";
};

export type ProjectGitHubContributor = {
  name: string;
  commitCount: number;
  githubUsername?: string | null;
  avatarUrl?: string | null;
};

export type ProjectGitHubRecentCommit = {
  sha: string | null;
  message: string;
  author: string;
  githubUsername?: string | null;
  avatarUrl?: string | null;
  committedAt: string | null;
  type?: string | null;
};

export type ProjectGitHubPreview = {
  repositoryLinked: boolean;
  authorizedInstallationId?: number | null;
  accessibleRepositoryCount?: number | null;
  accessScope?:
    | "NOT_AUTHORIZED"
    | "NO_REPOSITORIES"
    | "SINGLE_REPOSITORY"
    | "MULTIPLE_REPOSITORIES"
    | "ACCESS_UNAVAILABLE"
    | string
    | null;
  repositories: ProjectGitHubRepositoryPreview[];
  primaryRepositoryUrl?: string | null;
  activitySummary: ProjectGitHubActivitySummary;
  contributorsPreview: ProjectGitHubContributor[];
  recentCommitsPreview: ProjectGitHubRecentCommit[];
  pullRequestsPreview?: ProjectGitHubPullRequest[];
  hasUnacknowledgedAccess?: boolean;
};

export type ProjectGitHubPullRequest = {
  gitHubPullRequestId: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  isDraft: boolean;
  isMerged: boolean;
  authorLogin: string | null;
  mergedByGitHubId: number | null;
  mergedByLogin: string | null;
  sourceBranch: string;
  targetBranch: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  mergedAt: string | null;
  htmlUrl: string;
  additions: number | null;
  deletions: number | null;
  changedFiles: number | null;
  commitsCount: number | null;
  commentsCount: number | null;
  reviewCommentsCount: number | null;
};

export type ProjectGitHubPullRequestStatus =
  "all" | "open" | "draft" | "merged" | "closed";

export type ProjectGitHubPullRequestPageOptions = {
  size?: number;
  status?: ProjectGitHubPullRequestStatus;
  search?: string;
};

export type PaginatedListResult<T> = {
  items: T[];
  hasMore: boolean;
  page: number;
  size: number;
  total?: number;
};
