import {
  AVAILABLE_GITHUB_REPOSITORIES_TTL_MS,
  PROJECT_GITHUB_REPOSITORIES_TTL_MS,
  clearGitHubIntegrationCache,
  getAvailableGitHubRepositoriesCacheSnapshot,
  getProjectGitHubRepositoriesCacheSnapshot,
  setAvailableGitHubRepositoriesCache,
  setProjectGitHubRepositoriesCache,
  updateProjectGitHubRepositoriesCache,
} from "./githubIntegrationCache";
import type {
  GitHubAvailableRepositories,
  ProjectGitHubRepositories,
} from "../types";

const projectRepositories: ProjectGitHubRepositories = {
  projectId: "project-1",
  maxLinkedRepositories: 8,
  maxEnabledRepositories: 3,
  hasUnacknowledgedAccess: true,
  accessSources: [],
  repositories: [],
};

const available: GitHubAvailableRepositories = {
  sourceId: "source-1",
  items: [],
  totalCount: 0,
};

describe("GitHub integration memory cache", () => {
  beforeEach(() => clearGitHubIntegrationCache());

  it("treats project integration snapshots as fresh only inside the TTL", () => {
    setProjectGitHubRepositoriesCache(projectRepositories, 1_000);

    expect(
      getProjectGitHubRepositoriesCacheSnapshot(
        "project-1",
        1_000 + PROJECT_GITHUB_REPOSITORIES_TTL_MS - 1,
      )?.isFresh,
    ).toBe(true);
    expect(
      getProjectGitHubRepositoriesCacheSnapshot(
        "project-1",
        1_000 + PROJECT_GITHUB_REPOSITORIES_TTL_MS,
      )?.isFresh,
    ).toBe(false);
  });

  it("keeps available-repository discovery on a shorter TTL", () => {
    setAvailableGitHubRepositoriesCache(available, 5_000);

    expect(
      getAvailableGitHubRepositoriesCacheSnapshot(
        "source-1",
        5_000 + AVAILABLE_GITHUB_REPOSITORIES_TTL_MS - 1,
      )?.isFresh,
    ).toBe(true);
    expect(
      getAvailableGitHubRepositoriesCacheSnapshot(
        "source-1",
        5_000 + AVAILABLE_GITHUB_REPOSITORIES_TTL_MS,
      )?.isFresh,
    ).toBe(false);
  });

  it("patches cached mutation state without resetting the fetch age", () => {
    setProjectGitHubRepositoriesCache(projectRepositories, 10_000);
    updateProjectGitHubRepositoriesCache("project-1", (current) => ({
      ...current,
      hasUnacknowledgedAccess: false,
    }));

    const snapshot = getProjectGitHubRepositoriesCacheSnapshot(
      "project-1",
      10_001,
    );
    expect(snapshot?.data.hasUnacknowledgedAccess).toBe(false);
    expect(snapshot?.fetchedAt).toBe(10_000);
  });
});
