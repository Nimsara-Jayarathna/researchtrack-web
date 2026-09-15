import { renderHook, waitFor } from "@testing-library/react";
import type { ProjectGitHubRepositories } from "../types";
import { clearGitHubIntegrationCache, setProjectGitHubRepositoriesCache } from "../cache/githubIntegrationCache";

const getProjectGitHubRepositories = vi.hoisted(() => vi.fn());

vi.mock("../api/supervisorApi", () => ({
  supervisorApi: { getProjectGitHubRepositories },
}));

import { useProjectRepositories } from "./useProjectRepositories";

const response: ProjectGitHubRepositories = {
  projectId: "project-1",
  maxLinkedRepositories: 5,
  maxEnabledRepositories: 5,
  hasUnacknowledgedAccess: false,
  accessSources: [],
  repositories: [],
};

describe("useProjectRepositories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearGitHubIntegrationCache();
  });

  it("loads GitHubService persisted repository state", async () => {
    getProjectGitHubRepositories.mockResolvedValue(response);

    const { result } = renderHook(() => useProjectRepositories("project-1"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getProjectGitHubRepositories).toHaveBeenCalledWith("project-1", {
      forceRefresh: false,
    });
    expect(result.current.data).toEqual(response);
    expect(result.current.error).toBeNull();
  });

  it("does not request GitHub repository state while the consumer is disabled", async () => {
    getProjectGitHubRepositories.mockResolvedValue(response);

    const { result } = renderHook(() =>
      useProjectRepositories("project-1", { enabled: false }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getProjectGitHubRepositories).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
  });
  it("renders a cached snapshot immediately without a network call while it is fresh", async () => {
    setProjectGitHubRepositoriesCache(response);

    const { result } = renderHook(() => useProjectRepositories("project-1"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(response);
    expect(getProjectGitHubRepositories).not.toHaveBeenCalled();
  });

});
