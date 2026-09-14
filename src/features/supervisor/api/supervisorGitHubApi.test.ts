import { createSupervisorGitHubApi } from "./supervisorGitHubApi";
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
  accessSources: [],
  repositories: [],
};

function createApi() {
  const apiClient = {
    get: vi.fn(),
    post: vi.fn(),
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
  it("starts the GitHub App install flow through the canonical backend endpoint", async () => {
    const { api, apiClient } = createApi();
    apiClient.post.mockResolvedValue({
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

  it("creates a public source with the normalized URL", async () => {
    const { api, apiClient } = createApi();
    apiClient.post.mockResolvedValue(available);

    await api.createPublicGitHubAccessSource(
      "project-1",
      "github.com/openai/example.git/",
    );

    expect(apiClient.post).toHaveBeenCalledWith(
      "/api/github/access-source/public",
      {
        projectId: "project-1",
        repositoryUrl: "https://github.com/openai/example",
      },
    );
  });

  it("creates an owner-granted request with the exact normalized repository URL", async () => {
    const { api, apiClient } = createApi();
    apiClient.post.mockResolvedValue({
      requestId: "request-1",
      projectId: "project-1",
      repositoryOwner: "openai",
      repositoryName: "example",
      repositoryFullName: "openai/example",
      repositoryUrl: "https://github.com/openai/example",
      status: "PENDING",
      expiresAt: "2026-09-14T12:00:00Z",
      requestUrl: "https://app.example/github/request-access?token=safe",
    });

    await api.createGitHubRepositoryAccessRequest(
      "project-1",
      "github.com/openai/example.git/",
    );

    expect(apiClient.post).toHaveBeenCalledWith(
      "/api/github/access-requests",
      {
        projectId: "project-1",
        repositoryUrl: "https://github.com/openai/example",
      },
    );
  });

  it("rejects invalid owner-granted repository URLs before calling the backend", async () => {
    const { api, apiClient } = createApi();

    await expect(
      api.createGitHubRepositoryAccessRequest(
        "project-1",
        "https://github.com/openai/example/issues",
      ),
    ).rejects.toThrow("Invalid GitHub repository URL.");
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it("validates and continues a public owner-granted request through canonical endpoints", async () => {
    const { api, apiClient } = createApi();
    apiClient.get.mockResolvedValue({
      requestId: "request-1",
      repositoryOwner: "openai",
      repositoryName: "example",
      repositoryFullName: "openai/example",
      repositoryUrl: "https://github.com/openai/example",
      status: "PENDING",
      expiresAt: "2026-09-14T12:00:00Z",
      failureCode: null,
    });
    apiClient.post.mockResolvedValue({
      requestId: "request-1",
      githubAuthorizeUrl:
        "https://github.com/apps/researchtrack/installations/new?state=safe",
      expiresAt: "2026-09-14T12:00:00Z",
    });

    await api.validatePublicGitHubRepositoryAccessRequest("safe token");
    await api.continuePublicGitHubRepositoryAccessRequest("safe token");

    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/github/access-requests/validate?token=safe+token",
    );
    expect(apiClient.post).toHaveBeenCalledWith(
      "/api/github/access-requests/continue?token=safe+token",
      {},
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
});
