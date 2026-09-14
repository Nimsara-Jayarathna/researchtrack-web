import type { createRoleProjectApi } from "@/features/shared/api/createRoleProjectApi";
import type {
  GitHubAccessRequestCreateV2,
  GitHubAccessRequestSummary,
  GitHubAvailableRepositories,
  GitHubInstallStart,
  GitHubAccessUpdatedAcknowledge,
  GitHubAccessUpdatedSummary,
  LinkGitHubRepositoriesPayload,
  GitHubInstallationRepositoriesPage,
  ProjectGitHubRepositories,
  ProjectGitHubRepositoryListing,
  LinkProjectGitHubRepositoryRequest,
  ProjectGitHubRepositoryLink,
  SupervisorProjectDetail,
  GitHubEvidencePage,
  GitHubCommitEvidence,
  GitHubContributorEvidence,
  GitHubPullRequestEvidence,
  GitHubSyncRunEvidence,
} from "../types";

type RoleProjectApi = Omit<
  ReturnType<typeof createRoleProjectApi>,
  "clearCache"
>;
type ApiClient = typeof import("@/services/apiClient").apiClient;

type SupervisorProjectCache = Partial<Record<string, SupervisorProjectDetail>>;

type CreateSupervisorGitHubApiDeps = {
  apiClient: ApiClient;
  roleProjectApi: RoleProjectApi;
  cachedProjectsById: SupervisorProjectCache;
  invalidateProjectCaches: (projectId: string | null | undefined) => void;
};

export function createSupervisorGitHubApi({
  apiClient,
  roleProjectApi,
  cachedProjectsById,
  invalidateProjectCaches,
}: CreateSupervisorGitHubApiDeps) {
  return {
    refreshProjectGitHub(projectId: string): Promise<void> {
      return apiClient.post<void>(
        `/api/supervisor/projects/${projectId}/github/refresh`,
        {},
      );
    },

    startGitHubAccessSourceInstall(body: {
      projectId?: string;
      requestToken?: string;
    }): Promise<GitHubInstallStart> {
      return apiClient.post<GitHubInstallStart>(
        "/api/github/access-source/install/start",
        body,
      );
    },

    createGitHubAccessSourceRequest(
      projectId: string,
      ownerLogin: string,
    ): Promise<GitHubAccessRequestCreateV2> {
      return apiClient.post<GitHubAccessRequestCreateV2>(
        "/api/github/access-source/request",
        { projectId, ownerLogin },
      );
    },

    listGitHubAccessSourceRequests(
      projectId: string,
    ): Promise<GitHubAccessRequestSummary[]> {
      const params = new URLSearchParams({ projectId });
      return apiClient.get<GitHubAccessRequestSummary[]>(
        `/api/github/access-source/requests?${params.toString()}`,
      );
    },

    revokeGitHubAccessSourceRequest(
      projectId: string,
      requestId: string,
    ): Promise<{ projectId: string; requestId: string; status: string }> {
      const params = new URLSearchParams({ projectId });
      return apiClient.del<{ projectId: string; requestId: string; status: string }>(
        `/api/github/access-source/requests/${requestId}?${params.toString()}`,
      );
    },

    getAvailableGitHubRepositories(
      sourceId: string,
    ): Promise<GitHubAvailableRepositories> {
      const params = new URLSearchParams({ sourceId });
      return apiClient.get<GitHubAvailableRepositories>(
        `/api/github/repositories/available?${params.toString()}`,
      );
    },

    async linkGitHubRepositories(
      payload: LinkGitHubRepositoriesPayload,
    ): Promise<ProjectGitHubRepositories> {
      const data = await apiClient.post<ProjectGitHubRepositories>(
        "/api/github/repositories/link",
        payload,
      );
      invalidateProjectCaches(data.projectId);
      return data;
    },

    getProjectGitHubRepositories(
      projectId: string,
    ): Promise<ProjectGitHubRepositories> {
      return apiClient.get<ProjectGitHubRepositories>(
        `/api/projects/${projectId}/github-repositories`,
      );
    },

    async unlinkGitHubRepository(
      linkedRepositoryId: string,
    ): Promise<ProjectGitHubRepositories> {
      const data = await apiClient.del<ProjectGitHubRepositories>(
        `/api/github/repositories/${linkedRepositoryId}`,
      );
      invalidateProjectCaches(data.projectId);
      return data;
    },

    async enableGitHubRepository(
      linkedRepositoryId: string,
    ): Promise<ProjectGitHubRepositories> {
      const data = await apiClient.post<ProjectGitHubRepositories>(
        `/api/github/repositories/${linkedRepositoryId}/enable`,
        {},
      );
      invalidateProjectCaches(data.projectId);
      return data;
    },

    async disableGitHubRepository(
      linkedRepositoryId: string,
    ): Promise<ProjectGitHubRepositories> {
      const data = await apiClient.post<ProjectGitHubRepositories>(
        `/api/github/repositories/${linkedRepositoryId}/disable`,
        {},
      );
      invalidateProjectCaches(data.projectId);
      return data;
    },

    async disconnectGitHubAccessSource(
      sourceId: string,
    ): Promise<ProjectGitHubRepositories> {
      const data = await apiClient.del<ProjectGitHubRepositories>(
        `/api/github/access-source/${sourceId}`,
      );
      invalidateProjectCaches(data.projectId);
      return data;
    },

    async refreshGitHubRepository(
      projectId: string,
      linkedRepositoryId: string,
    ): Promise<void> {
      await apiClient.post<void>(
        `/api/supervisor/projects/${projectId}/github/repositories/${linkedRepositoryId}/sync`,
        {},
      );
      invalidateProjectCaches(projectId);
    },

    getGitHubRepositoryCommits(
      projectId: string,
      linkedRepositoryId: string,
      page = 1,
      size = 50,
    ): Promise<GitHubEvidencePage<GitHubCommitEvidence>> {
      return apiClient.get<GitHubEvidencePage<GitHubCommitEvidence>>(
        `/api/supervisor/projects/${projectId}/github/repositories/${linkedRepositoryId}/commits?page=${page}&size=${size}`,
      );
    },

    getGitHubRepositoryContributors(
      projectId: string,
      linkedRepositoryId: string,
      page = 1,
      size = 50,
    ): Promise<GitHubEvidencePage<GitHubContributorEvidence>> {
      return apiClient.get<GitHubEvidencePage<GitHubContributorEvidence>>(
        `/api/supervisor/projects/${projectId}/github/repositories/${linkedRepositoryId}/contributors?page=${page}&size=${size}`,
      );
    },

    getGitHubRepositoryPullRequests(
      projectId: string,
      linkedRepositoryId: string,
      page = 1,
      size = 50,
    ): Promise<GitHubEvidencePage<GitHubPullRequestEvidence>> {
      return apiClient.get<GitHubEvidencePage<GitHubPullRequestEvidence>>(
        `/api/supervisor/projects/${projectId}/github/repositories/${linkedRepositoryId}/pull-requests?page=${page}&size=${size}`,
      );
    },

    getGitHubRepositorySyncRuns(
      projectId: string,
      linkedRepositoryId: string,
      page = 1,
      size = 25,
    ): Promise<GitHubEvidencePage<GitHubSyncRunEvidence>> {
      return apiClient.get<GitHubEvidencePage<GitHubSyncRunEvidence>>(
        `/api/supervisor/projects/${projectId}/github/repositories/${linkedRepositoryId}/sync-runs?page=${page}&size=${size}`,
      );
    },

    async selectPrimaryGitHubRepository(
      linkedRepositoryId: string,
    ): Promise<ProjectGitHubRepositories> {
      const data = await apiClient.post<ProjectGitHubRepositories>(
        `/api/github/repositories/${linkedRepositoryId}/select`,
        {},
      );
      invalidateProjectCaches(data.projectId);
      return data;
    },

    async updateGitHubRepositoryDisplayName(
      linkedRepositoryId: string,
      customName: string | null,
    ): Promise<ProjectGitHubRepositories> {
      const data = await apiClient.post<ProjectGitHubRepositories>(
        `/api/github/repositories/${linkedRepositoryId}/display-name`,
        { customName },
      );
      invalidateProjectCaches(data.projectId);
      return data;
    },

    getInstallationRepositories(
      projectId: string,
      installationId: number,
      page = 1,
      size?: number,
    ): Promise<GitHubInstallationRepositoriesPage> {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (typeof size === "number" && Number.isFinite(size) && size > 0) {
        params.set("size", String(Math.floor(size)));
      }

      return apiClient.get<GitHubInstallationRepositoriesPage>(
        `/api/supervisor/projects/${projectId}/github/installations/${installationId}/repositories?${params.toString()}`,
      );
    },

    getProjectRepositoriesInventory(
      projectId: string,
    ): Promise<ProjectGitHubRepositoryListing> {
      return apiClient.get<ProjectGitHubRepositoryListing>(
        `/api/supervisor/projects/${projectId}/github/repositories/inventory`,
      );
    },

    getProjectGitHubAccessUpdatedSummary(
      projectId: string,
    ): Promise<GitHubAccessUpdatedSummary> {
      return apiClient.get<GitHubAccessUpdatedSummary>(
        `/api/supervisor/projects/${projectId}/github/access-updated/summary`,
      );
    },

    acknowledgeProjectGitHubAccessUpdated(
      projectId: string,
    ): Promise<GitHubAccessUpdatedAcknowledge> {
      return apiClient.post<GitHubAccessUpdatedAcknowledge>(
        `/api/supervisor/projects/${projectId}/github/access-updated/acknowledge`,
        {},
      );
    },

    async linkProjectGitHubRepository(
      projectId: string,
      body: LinkProjectGitHubRepositoryRequest,
    ): Promise<ProjectGitHubRepositoryLink> {
      const linked = await apiClient.post<ProjectGitHubRepositoryLink>(
        `/api/supervisor/projects/${projectId}/github/link`,
        body,
      );
      delete cachedProjectsById[projectId];
      roleProjectApi.invalidateProjectGitHubCaches(projectId);
      return linked;
    },

    async removeProjectGitHubAccessAuthorization(
      projectId: string,
    ): Promise<SupervisorProjectDetail> {
      const updated = await apiClient.post<SupervisorProjectDetail>(
        `/api/supervisor/projects/${projectId}/github/access/remove`,
        {},
      );
      cachedProjectsById[projectId] = updated;
      roleProjectApi.invalidateProjectGitHubCaches(projectId);
      return updated;
    },
  };
}
