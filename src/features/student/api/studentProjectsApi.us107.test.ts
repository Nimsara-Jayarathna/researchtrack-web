import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStudentProjectsApi } from "./studentProjectsApi";

const apiClient = { get: vi.fn() };

function createApi(cachedProjectsById: Record<string, unknown> = {}) {
  return createStudentProjectsApi({
    apiClient: apiClient as never,
    cachedProjectsById: cachedProjectsById as never,
    inFlightProjectRequests: {},
  });
}

describe("studentProjectsApi US-107 membership freshness", () => {
  beforeEach(() => vi.clearAllMocks());

  it("drops stale detail cache when forced membership revalidation fails", async () => {
    const cachedProjectsById = {
      "project-1": { id: "project-1", title: "Stale project" },
    };
    const api = createApi(cachedProjectsById);

    apiClient.get.mockRejectedValueOnce(new Error("not found"));

    await expect(api.getProjectById("project-1", true)).rejects.toThrow(
      "not found",
    );
    expect(cachedProjectsById).not.toHaveProperty("project-1");
  });
});
