import { createRoleProjectApi } from "./createRoleProjectApi";

const dashboard = {
  connected: true,
  accessSourceId: "source-1",
  accessType: "INSTALLATION_DIRECT",
  ownerLogin: "openai",
  installationId: 42,
  repositoryCount: 1,
  lastSyncedAt: null,
  syncStatus: "SUCCESS",
  hasUnacknowledgedAccess: false,
  contributorsPreview: [],
  recentCommitsPreview: [],
};

function createApi() {
  const apiClient = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    del: vi.fn(),
  };
  const api = createRoleProjectApi({
    apiClient: apiClient as never,
    roleBasePath: "/api/supervisor",
  });
  return { api, apiClient };
}

describe("role project GitHub dashboard cache", () => {
  it("reuses a dashboard snapshot on repeated tab reads", async () => {
    const { api, apiClient } = createApi();
    apiClient.get.mockResolvedValue(dashboard);

    await api.getProjectGitHubDashboard("project-1", false, "link-1");
    await api.getProjectGitHubDashboard("project-1", false, "link-1");

    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it("force refresh bypasses the dashboard TTL", async () => {
    const { api, apiClient } = createApi();
    apiClient.get.mockResolvedValue(dashboard);

    await api.getProjectGitHubDashboard("project-1", false, "link-1");
    await api.getProjectGitHubDashboard("project-1", true, "link-1");

    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });
  it("deduplicates concurrent dashboard loads", async () => {
    const { api, apiClient } = createApi();
    let resolveRequest!: (value: typeof dashboard) => void;
    apiClient.get.mockReturnValue(
      new Promise<typeof dashboard>((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const first = api.getProjectGitHubDashboard("project-1", false, "link-1");
    const second = api.getProjectGitHubDashboard("project-1", true, "link-1");
    resolveRequest(dashboard);

    await Promise.all([first, second]);
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it("does not repopulate the dashboard cache after a session-style cache clear", async () => {
    const { api, apiClient } = createApi();
    let resolveRequest!: (value: typeof dashboard) => void;
    apiClient.get.mockReturnValueOnce(
      new Promise<typeof dashboard>((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const first = api.getProjectGitHubDashboard("project-1", false, "link-1");
    api.clearCache();
    resolveRequest(dashboard);
    await first;

    apiClient.get.mockResolvedValueOnce(dashboard);
    await api.getProjectGitHubDashboard("project-1", false, "link-1");
    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

  it("loads paginated pull requests through the role-aware GitHub evidence route", async () => {
    const { api, apiClient } = createApi();
    apiClient.get.mockResolvedValue({
      items: [],
      page: 2,
      size: 8,
      total: 13,
      hasMore: false,
    });

    const result = await api.getProjectGitHubPullRequestsPage(
      "project-1",
      2,
      "link-1",
      { size: 8, status: "merged", search: "student" },
    );

    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/supervisor/projects/project-1/github/repositories/link-1/pull-requests?page=2&size=8&status=merged&search=student",
    );
    expect(result.total).toBe(13);
    expect(result.hasMore).toBe(false);
  });
});
