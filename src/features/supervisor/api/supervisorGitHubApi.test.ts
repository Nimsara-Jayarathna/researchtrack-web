import { createSupervisorGitHubApi } from "./supervisorGitHubApi";
import {
  clearGitHubIntegrationCache,
  getProjectGitHubRepositoriesCacheSnapshot,
} from "../cache/githubIntegrationCache";
import type {
  GitHubAvailableRepositories,
  LinkGitHubRepositoriesPayload,
  ProjectGitHubRepositories,
} from "../types";

const available: GitHubAvailableRepositories = {
  sourceId: "source-1",
  items: [
    {
      id: "repository-1",
      githubRepoId: 1296269,
      fullName: "openai/example",
      name: "example",
      ownerLogin: "openai",
      defaultBranch: "main",
      url: "https://github.com/openai/example",
    },
  ],
  totalCount: 1,
};

const projectRepositories: ProjectGitHubRepositories = {
  projectId: "project-1",
  maxLinkedRepositories: 5,
  maxEnabledRepositories: 5,
  hasUnacknowledgedAccess: false,
  accessSources: [],
  repositories: [],
};

function createApi() {
  const apiClient = {
    get: vi.fn(),
    post: vi.fn(),
    del: vi.fn(),
  };
  const invalidateProjectCaches = vi.fn();
  const api = createSupervisorGitHubApi({
    apiClient: apiClient as never,
    roleProjectApi: {} as never,
    cachedProjectsById: {},
    invalidateProjectCaches,
  });
  return { api, apiClient, invalidateProjectCaches };
}

describe("supervisor GitHub API contract", () => {
  beforeEach(() => clearGitHubIntegrationCache());
  it("starts the GitHub App install flow through the canonical backend endpoint", async () => {
    const { api, apiClient } = createApi();
    apiClient.post.mockResolvedValue({
      projectId: "project-1",
      githubAuthorizeUrl:
        "https://github.com/apps/researchtrack/installations/new?state=safe",
      flowType: "INSTALLATION_DIRECT",
      expiresAt: "2026-09-12T06:00:00Z",
    });

    await api.startGitHubAccessSourceInstall({ projectId: "project-1" });

    expect(apiClient.post).toHaveBeenCalledWith(
      "/api/github/access-source/install/start",
      { projectId: "project-1" },
    );
  });

  it("loads available repositories from the persisted source endpoint", async () => {
    const { api, apiClient } = createApi();
    apiClient.get.mockResolvedValue(available);

    await api.getAvailableGitHubRepositories("source-1");

    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/github/repositories/available?sourceId=source-1",
    );
  });

  it("links using the internal validated repository id", async () => {
    const { api, apiClient, invalidateProjectCaches } = createApi();
    apiClient.post.mockResolvedValue(projectRepositories);
    const payload: LinkGitHubRepositoriesPayload = {
      projectId: "project-1",
      sourceId: "source-1",
      repositories: [
        {
          githubRepositoryId: "repository-1",
          customName: "Research repository",
          primary: true,
        },
      ],
    };

    await api.linkGitHubRepositories(payload);

    expect(apiClient.post).toHaveBeenCalledWith(
      "/api/github/repositories/link",
      payload,
    );
    expect(invalidateProjectCaches).toHaveBeenCalledWith("project-1");
  });

  it("surfaces repository-link API failures without inventing success", async () => {
    const { api, apiClient } = createApi();
    const failure = new Error("forbidden");
    apiClient.post.mockRejectedValue(failure);

    await expect(
      api.linkGitHubRepositories({
        projectId: "project-1",
        sourceId: "source-1",
        repositories: [{ githubRepositoryId: "repository-1" }],
      }),
    ).rejects.toBe(failure);
  });

  it("loads linked repositories from the project GitHub read endpoint", async () => {
    const { api, apiClient } = createApi();
    apiClient.get.mockResolvedValue(projectRepositories);

    await api.getProjectGitHubRepositories("project-1");

    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/projects/project-1/github-repositories",
    );
  });

  it("creates a GitHub access request for the expected GitHub owner", async () => {
    const { api, apiClient } = createApi();
    apiClient.post.mockResolvedValue({
      id: "request-1",
      projectId: "project-1",
      ownerLogin: "openai",
      requestUrl: "https://app.example.test/github/request-access?token=safe",
      status: "PENDING",
      expiresAt: "2026-09-15T06:00:00Z",
    });

    await api.createGitHubAccessSourceRequest("project-1", "openai");

    expect(apiClient.post).toHaveBeenCalledWith(
      "/api/github/access-source/request",
      { projectId: "project-1", ownerLogin: "openai" },
    );
  });

  it("revokes a pending access request through the project-scoped endpoint", async () => {
    const { api, apiClient } = createApi();
    apiClient.del.mockResolvedValue({
      projectId: "project-1",
      requestId: "request-1",
      status: "REVOKED",
    });

    await api.revokeGitHubAccessSourceRequest("project-1", "request-1");

    expect(apiClient.del).toHaveBeenCalledWith(
      "/api/github/access-source/requests/request-1?projectId=project-1",
    );
  });

  it("unlinks one repository without disconnecting its GitHub App source", async () => {
    const { api, apiClient, invalidateProjectCaches } = createApi();
    apiClient.del.mockResolvedValue(projectRepositories);

    await api.unlinkGitHubRepository("link-1");

    expect(apiClient.del).toHaveBeenCalledWith(
      "/api/github/repositories/link-1",
    );
    expect(invalidateProjectCaches).toHaveBeenCalledWith("project-1");
  });

  it("disables an existing linked repository through the lifecycle endpoint", async () => {
    const { api, apiClient, invalidateProjectCaches } = createApi();
    apiClient.post.mockResolvedValue(projectRepositories);

    await api.disableGitHubRepository("link-1");

    expect(apiClient.post).toHaveBeenCalledWith(
      "/api/github/repositories/link-1/disable",
      {},
    );
    expect(invalidateProjectCaches).toHaveBeenCalledWith("project-1");
  });

  it("disconnects an access source separately from repository unlink", async () => {
    const { api, apiClient, invalidateProjectCaches } = createApi();
    apiClient.del.mockResolvedValue(projectRepositories);

    await api.disconnectGitHubAccessSource("source-1");

    expect(apiClient.del).toHaveBeenCalledWith(
      "/api/github/access-source/source-1",
    );
    expect(invalidateProjectCaches).toHaveBeenCalledWith("project-1");
  });

  it("reuses a fresh project repository snapshot without another GET", async () => {
    const { api, apiClient } = createApi();
    apiClient.get.mockResolvedValue(projectRepositories);

    await api.getProjectGitHubRepositories("project-1");
    await api.getProjectGitHubRepositories("project-1");

    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it("deduplicates concurrent project repository requests", async () => {
    const { api, apiClient } = createApi();
    let resolveRequest!: (value: ProjectGitHubRepositories) => void;
    apiClient.get.mockReturnValue(
      new Promise<ProjectGitHubRepositories>((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const first = api.getProjectGitHubRepositories("project-1");
    const second = api.getProjectGitHubRepositories("project-1");
    resolveRequest(projectRepositories);

    await Promise.all([first, second]);
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it("force-refreshes a cached project repository snapshot", async () => {
    const { api, apiClient } = createApi();
    apiClient.get.mockResolvedValue(projectRepositories);

    await api.getProjectGitHubRepositories("project-1");
    await api.getProjectGitHubRepositories("project-1", { forceRefresh: true });

    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

  it("deduplicates available repository discovery per access source", async () => {
    const { api, apiClient } = createApi();
    let resolveRequest!: (value: GitHubAvailableRepositories) => void;
    apiClient.get.mockReturnValue(
      new Promise<GitHubAvailableRepositories>((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const first = api.getAvailableGitHubRepositories("source-1");
    const second = api.getAvailableGitHubRepositories("source-1");
    resolveRequest(available);

    await Promise.all([first, second]);
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it("does not repopulate the session cache from a request that completes after cache clear", async () => {
    const { api, apiClient } = createApi();
    let resolveRequest!: (value: ProjectGitHubRepositories) => void;
    apiClient.get.mockReturnValue(
      new Promise<ProjectGitHubRepositories>((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const request = api.getProjectGitHubRepositories("project-1");
    clearGitHubIntegrationCache();
    resolveRequest(projectRepositories);
    await request;

    expect(getProjectGitHubRepositoriesCacheSnapshot("project-1")).toBeNull();
  });
});
