import { renderHook, waitFor } from "@testing-library/react";
import type { ProjectGitHubRepositories } from "../types";

const getProjectGitHubRepositories = vi.hoisted(() => vi.fn());

vi.mock("../api/supervisorApi", () => ({
  supervisorApi: { getProjectGitHubRepositories },
}));

import { useProjectRepositories } from "./useProjectRepositories";

const response: ProjectGitHubRepositories = {
  projectId: "project-1",
  maxLinkedRepositories: 5,
  maxEnabledRepositories: 5,
  accessSources: [],
  repositories: [],
};

describe("useProjectRepositories", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads GitHubService persisted repository state", async () => {
    getProjectGitHubRepositories.mockResolvedValue(response);

    const { result } = renderHook(() => useProjectRepositories("project-1"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getProjectGitHubRepositories).toHaveBeenCalledWith("project-1");
    expect(result.current.data).toEqual(response);
    expect(result.current.error).toBeNull();
  });
});
