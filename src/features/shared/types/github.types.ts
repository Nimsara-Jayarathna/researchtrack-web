export type GitHubAccessType = "INSTALLATION_DIRECT" | "INSTALLATION_REQUESTED";
export type GitHubOwnerType = "USER" | "ORG";
export type GitHubConnectionStatus = "CONNECTED" | "SUSPENDED" | "REMOVED";
export type GitHubRepositoryAccessStatus =
  | "AVAILABLE"
  | "REPOSITORY_ACCESS_REVOKED"
  | "INSTALLATION_SUSPENDED"
  | "INSTALLATION_REMOVED";
export type GitHubSyncStatus =
  "IN_PROGRESS" | "PENDING" | "SUCCESS" | "FAILED" | "DISABLED";

export type GitHubAccessSource = {
  id: string;
  projectId: string;
  installationId: number | null;
  ownerLogin: string;
  ownerType: GitHubOwnerType;
  accessType: GitHubAccessType;
  connectionStatus: GitHubConnectionStatus;
  active: boolean;
  createdAt: string;
};

export type GitHubRepositoryOption = {
  id: string;
  githubRepoId: number;
  fullName: string;
  name: string;
  ownerLogin: string;
  defaultBranch: string | null;
  url: string;
};

export type GitHubAvailableRepositories = {
  sourceId: string;
  items: GitHubRepositoryOption[];
  totalCount: number;
};

export type LinkGitHubRepositoriesPayload = {
  projectId: string;
  sourceId: string;
  repositories: Array<{
    githubRepositoryId: string;
    customName?: string | null;
    primary?: boolean;
  }>;
};

export type ProjectRepositoryLink = {
  id: string;
  sourceId: string | null;
  accessType?: GitHubAccessType | string | null;
  githubRepositoryId: string | null;
  githubRepoId: number;
  fullName: string | null;
  name: string | null;
  customName: string | null;
  ownerLogin: string | null;
  defaultBranch: string | null;
  url: string | null;
  primary: boolean;
  enabled: boolean;
  linkedAt: string;
  lastSyncedAt: string | null;
  syncRevision?: number;
  syncStatus: GitHubSyncStatus | null;
  accessStatus: GitHubRepositoryAccessStatus;
};

export type ProjectGitHubRepositories = {
  projectId: string;
  maxLinkedRepositories: number;
  maxEnabledRepositories: number;
  hasUnacknowledgedAccess: boolean;
  accessSources: GitHubAccessSource[];
  repositories: ProjectRepositoryLink[];
};

export type GitHubRepositorySyncState = {
  linkedRepositoryId: string;
  syncRevision: number;
  syncStatus: string;
  lastSyncedAt: string | null;
  enabled: boolean;
  primary: boolean;
};

export type GitHubSyncState = {
  projectId: string;
  repositories: GitHubRepositorySyncState[];
};
