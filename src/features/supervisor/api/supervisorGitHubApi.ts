import {
  clearAvailableGitHubRepositoriesInFlight,
  clearProjectGitHubRepositoriesInFlight,
  getAvailableGitHubRepositoriesCacheSnapshot,
  getAvailableGitHubRepositoriesInFlight,
  getGitHubIntegrationCacheGeneration,
  getProjectGitHubRepositoriesCacheSnapshot,
  getProjectGitHubRepositoriesInFlight,
  invalidateAllAvailableGitHubRepositoriesCache,
  invalidateAvailableGitHubRepositoriesCache,
  invalidateProjectGitHubRepositoriesCache,
  setAvailableGitHubRepositoriesCache,
  setAvailableGitHubRepositoriesInFlight,
  setProjectGitHubRepositoriesCache,
  setProjectGitHubRepositoriesInFlight,
  updateProjectGitHubRepositoriesCache,
} from "../cache/githubIntegrationCache";
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
      if (body.projectId) {
        invalidateProjectGitHubRepositoriesCache(body.projectId);
      }
      invalidateAllAvailableGitHubRepositoriesCache();
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
      options: { forceRefresh?: boolean } = {},
    ): Promise<GitHubAvailableRepositories> {
      const cached = getAvailableGitHubRepositoriesCacheSnapshot(sourceId);
      if (!options.forceRefresh && cached?.isFresh) {
        return Promise.resolve(cached.data);
      }

      const inFlight = getAvailableGitHubRepositoriesInFlight(sourceId);
      if (inFlight) return inFlight;

      const params = new URLSearchParams({ sourceId });
      const cacheGeneration = getGitHubIntegrationCacheGeneration();
      const baseRequest = apiClient
        .get<GitHubAvailableRepositories>(
          `/api/github/repositories/available?${params.toString()}`,
        )
        .then((data) => {
          setAvailableGitHubRepositoriesCache(
            data,
            Date.now(),
            cacheGeneration,
          );
          return data;
        });
      let request!: Promise<GitHubAvailableRepositories>;
      request = baseRequest.finally(() =>
        clearAvailableGitHubRepositoriesInFlight(sourceId, request),
      );
      setAvailableGitHubRepositoriesInFlight(sourceId, request);
      return request;
    },

    async linkGitHubRepositories(
      payload: LinkGitHubRepositoriesPayload,
    ): Promise<ProjectGitHubRepositories> {
      const cacheGeneration = getGitHubIntegrationCacheGeneration();
      const data = await apiClient.post<ProjectGitHubRepositories>(
        "/api/github/repositories/link",
        payload,
      );
      invalidateProjectCaches(data.projectId);
      setProjectGitHubRepositoriesCache(data, Date.now(), cacheGeneration);
      return data;
    },

    getProjectGitHubRepositories(
      projectId: string,
      options: { forceRefresh?: boolean } = {},
    ): Promise<ProjectGitHubRepositories> {
      const cached = getProjectGitHubRepositoriesCacheSnapshot(projectId);
      if (!options.forceRefresh && cached?.isFresh) {
        return Promise.resolve(cached.data);
      }

      const inFlight = getProjectGitHubRepositoriesInFlight(projectId);
      if (inFlight) return inFlight;

      const cacheGeneration = getGitHubIntegrationCacheGeneration();
      const baseRequest = apiClient
        .get<ProjectGitHubRepositories>(
          `/api/projects/${projectId}/github-repositories`,
        )
        .then((data) => {
          setProjectGitHubRepositoriesCache(
            data,
            Date.now(),
            cacheGeneration,
          );
          return data;
        });
      let request!: Promise<ProjectGitHubRepositories>;
      request = baseRequest.finally(() =>
        clearProjectGitHubRepositoriesInFlight(projectId, request),
      );
      setProjectGitHubRepositoriesInFlight(projectId, request);
      return request;
    },

    async unlinkGitHubRepository(
      linkedRepositoryId: string,
    ): Promise<ProjectGitHubRepositories> {
      const cacheGeneration = getGitHubIntegrationCacheGeneration();
      const data = await apiClient.del<ProjectGitHubRepositories>(
        `/api/github/repositories/${linkedRepositoryId}`,
      );
      invalidateProjectCaches(data.projectId);
      setProjectGitHubRepositoriesCache(data, Date.now(), cacheGeneration);
      return data;
    },

    async enableGitHubRepository(
      linkedRepositoryId: string,
    ): Promise<ProjectGitHubRepositories> {
      const cacheGeneration = getGitHubIntegrationCacheGeneration();
      const data = await apiClient.post<ProjectGitHubRepositories>(
        `/api/github/repositories/${linkedRepositoryId}/enable`,
        {},
      );
      invalidateProjectCaches(data.projectId);
      setProjectGitHubRepositoriesCache(data, Date.now(), cacheGeneration);
      return data;
    },

    async disableGitHubRepository(
      linkedRepositoryId: string,
    ): Promise<ProjectGitHubRepositories> {
      const cacheGeneration = getGitHubIntegrationCacheGeneration();
      const data = await apiClient.post<ProjectGitHubRepositories>(
        `/api/github/repositories/${linkedRepositoryId}/disable`,
        {},
      );
      invalidateProjectCaches(data.projectId);
      setProjectGitHubRepositoriesCache(data, Date.now(), cacheGeneration);
      return data;
    },

    async disconnectGitHubAccessSource(
      sourceId: string,
    ): Promise<ProjectGitHubRepositories> {
      const cacheGeneration = getGitHubIntegrationCacheGeneration();
      const data = await apiClient.del<ProjectGitHubRepositories>(
        `/api/github/access-source/${sourceId}`,
      );
      invalidateProjectCaches(data.projectId);
      invalidateAvailableGitHubRepositoriesCache(sourceId, cacheGeneration);
      setProjectGitHubRepositoriesCache(data, Date.now(), cacheGeneration);
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
      updateProjectGitHubRepositoriesCache(projectId, (current) => ({
        ...current,
        repositories: current.repositories.map((repository) =>
          repository.id === linkedRepositoryId
            ? { ...repository, syncStatus: "PENDING" }
            : repository,
        ),
      }));
      roleProjectApi.invalidateProjectGitHubCaches(projectId);
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
      const cacheGeneration = getGitHubIntegrationCacheGeneration();
      const data = await apiClient.post<ProjectGitHubRepositories>(
        `/api/github/repositories/${linkedRepositoryId}/select`,
        {},
      );
      invalidateProjectCaches(data.projectId);
      setProjectGitHubRepositoriesCache(data, Date.now(), cacheGeneration);
      return data;
    },

    async updateGitHubRepositoryDisplayName(
      linkedRepositoryId: string,
      customName: string | null,
    ): Promise<ProjectGitHubRepositories> {
      const cacheGeneration = getGitHubIntegrationCacheGeneration();
      const data = await apiClient.post<ProjectGitHubRepositories>(
        `/api/github/repositories/${linkedRepositoryId}/display-name`,
        { customName },
      );
      invalidateProjectCaches(data.projectId);
      setProjectGitHubRepositoriesCache(data, Date.now(), cacheGeneration);
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

    async acknowledgeProjectGitHubAccessUpdated(
      projectId: string,
    ): Promise<GitHubAccessUpdatedAcknowledge> {
      const result = await apiClient.post<GitHubAccessUpdatedAcknowledge>(
        `/api/supervisor/projects/${projectId}/github/access-updated/acknowledge`,
        {},
      );
      updateProjectGitHubRepositoriesCache(projectId, (current) => ({
        ...current,
        hasUnacknowledgedAccess: false,
      }));
      return result;
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
      invalidateProjectGitHubRepositoriesCache(projectId);
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
      invalidateProjectGitHubRepositoriesCache(projectId);
      invalidateAllAvailableGitHubRepositoriesCache();
      return updated;
    },
  };
}
