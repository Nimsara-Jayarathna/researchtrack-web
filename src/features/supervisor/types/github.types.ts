import type { ProjectGitHubPreview } from "@/features/projects/types";
import type { GitHubAvailableRepositories } from "@/features/shared/types/github.types";

export type {
  GitHubAccessSource,
  GitHubAccessType,
  GitHubAvailableRepositories,
  GitHubOwnerType,
  GitHubRepositoryOption,
  GitHubSyncStatus,
  LinkGitHubRepositoriesPayload,
  ProjectGitHubRepositories,
  ProjectRepositoryLink,
} from "@/features/shared/types/github.types";

export type ProjectGitHubActivity = ProjectGitHubPreview;

export type GitHubInstallationRepository = {
  repositoryId: number;
  name: string;
  fullName: string;
  url: string;
  ownerLogin: string;
  defaultBranch: string | null;
};

export type GitHubInstallationRepositoriesPage = {
  items: GitHubInstallationRepository[];
  page: number;
  size: number;
  returnedCount: number;
  totalCount: number | null;
  hasNext: boolean;
  hasPrevious: boolean;
  nextPage: number | null;
};

export type LinkProjectGitHubRepositoryRequest = {
  installationId: number;
  repositoryId: number;
};

export type ProjectGitHubRepositoryLink = {
  projectId: string;
  installationId: number;
  repositoryId: number;
  name: string;
  fullName: string;
  url: string;
  ownerLogin: string;
  defaultBranch: string | null;
  lastSyncedAt: string | null;
};

export type GitHubAccessRequestStatus =
  "PENDING" | "COMPLETED" | "FAILED" | "EXPIRED" | "REVOKED";

export type GitHubRepositoryAccessRequestValidation = {
  projectId: string;
  projectTitle: string;
  ownerLogin: string;
  status: GitHubAccessRequestStatus | string;
  expiresAt: string;
};

export type GitHubRepositoryAccessRequestContinue = {
  projectId: string;
  githubAuthorizeUrl: string;
};

export type GitHubAccessUpdatedSummary = {
  projectId: string;
  projectTitle: string;
  installationId: number;
  sourceId?: string | null;
  flowType?: "INSTALLATION_DIRECT" | "INSTALLATION_REQUESTED" | null;
  accessScope: string;
  accessibleRepositoryCount: number;
  repositories: GitHubInstallationRepository[];
};

export type GitHubAccessUpdatedAcknowledge = {
  projectId: string;
};

export type GitHubInstallStart = {
  projectId: string;
  githubAuthorizeUrl: string;
  flowType: "INSTALLATION_DIRECT" | "INSTALLATION_REQUESTED";
  expiresAt: string;
};

export type GitHubAccessRequestCreateV2 = {
  id: string;
  projectId: string;
  ownerLogin: string;
  requestUrl: string;
  status: GitHubAccessRequestStatus | string;
  expiresAt: string;
};

export type GitHubAccessRequestSummary = {
  id: string;
  projectId: string;
  projectTitle: string;
  ownerLogin: string;
  status: GitHubAccessRequestStatus | string;
  requestUrl: string | null;
  createdAt: string;
  expiresAt: string;
  completedAt: string | null;
  revokedAt: string | null;
  sourceId: string | null;
  installationId: number | null;
  errorCode: string | null;
};

export type ProjectGitHubRepositoryListing = {
  projectId: string;
  inventory: GitHubAvailableRepositories[];
};

export type GitHubEvidencePage<T> = {
  items: T[];
  page: number;
  size: number;
  totalCount: number;
  hasNext: boolean;
};

export type GitHubCommitEvidence = {
  sha: string;
  message: string;
  authorGitHubId: number | null;
  authorLogin: string | null;
  authorName: string | null;
  authoredAt: string | null;
  committedAt: string | null;
  htmlUrl: string;
  additions: number | null;
  deletions: number | null;
  changedFiles: number | null;
};

export type GitHubContributorEvidence = {
  gitHubUserId: number;
  login: string;
  avatarUrl: string | null;
  profileUrl: string | null;
  gitHubContributionCount: number;
  observedCommitCount: number;
  observedAdditions: number;
  observedDeletions: number;
  observedChangedFiles: number;
  firstCommitAt: string | null;
  lastCommitAt: string | null;
  lastSyncedAt: string;
};

export type GitHubPullRequestEvidence = {
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

export type GitHubSyncRunEvidence = {
  id: string;
  trigger: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  commitsFetched: number;
  contributorsFetched: number;
  pullRequestsFetched: number;
  reviewsFetched: number;
  branchesFetched: number;
  errorCode: string | null;
  errorMessage: string | null;
};
