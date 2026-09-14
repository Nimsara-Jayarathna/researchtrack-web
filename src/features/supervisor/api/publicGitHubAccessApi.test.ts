import { beforeEach, describe, expect, it, vi } from "vitest";

const publicApiClient = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock("@/services/apiClient", () => ({ publicApiClient }));

import {
  clearPublicGitHubAccessValidationCacheForTests,
  publicGitHubAccessApi,
} from "./publicGitHubAccessApi";

describe("publicGitHubAccessApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearPublicGitHubAccessValidationCacheForTests();
  });

  it("deduplicates validation for the same token", async () => {
    publicApiClient.get.mockResolvedValue({ status: "PENDING" });

    const first = publicGitHubAccessApi.validate("request-token");
    const second = publicGitHubAccessApi.validate("request-token");

    await expect(Promise.all([first, second])).resolves.toEqual([
      { status: "PENDING" },
      { status: "PENDING" },
    ]);
    expect(publicApiClient.get).toHaveBeenCalledTimes(1);
    expect(publicApiClient.get).toHaveBeenCalledWith(
      "/api/github/access-requests/validate?token=request-token",
    );
  });

  it("continues authorization through the public client", async () => {
    publicApiClient.post.mockResolvedValue({
      projectId: "project-1",
      githubAuthorizeUrl: "https://github.com/apps/researchtrack/installations/new",
    });

    await publicGitHubAccessApi.continue("request-token");

    expect(publicApiClient.post).toHaveBeenCalledWith(
      "/api/github/access-requests/continue?token=request-token",
      {},
    );
  });
});
