import { renderHook, waitFor } from "@testing-library/react";
import { ApiException } from "@/services/apiClient";

const getAvailableGitHubRepositories = vi.hoisted(() => vi.fn());
vi.mock("../api/supervisorApi", () => ({
  supervisorApi: { getAvailableGitHubRepositories },
}));

import { useAvailableRepositories } from "./useAvailableRepositories";

describe("useAvailableRepositories", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads repositories for the validated access source id", async () => {
    getAvailableGitHubRepositories.mockResolvedValue({
      sourceId: "source-1",
      items: [],
      totalCount: 0,
    });

    const { result } = renderHook(() => useAvailableRepositories("source-1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getAvailableGitHubRepositories).toHaveBeenCalledWith("source-1");
    expect(result.current.data?.sourceId).toBe("source-1");
  });

  it("preserves unauthorized backend responses for the UI instead of showing repositories", async () => {
    getAvailableGitHubRepositories.mockRejectedValue(
      new ApiException({
        timestamp: "2026-09-12T06:00:00Z",
        status: 403,
        error: "Forbidden",
        code: "FORBIDDEN",
        message:
          "Only the owning Supervisor can manage this project's GitHub integration.",
        path: "/api/github/repositories/available",
        traceId: null,
        details: [],
      }),
    );

    const { result } = renderHook(() => useAvailableRepositories("source-1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toMatchObject({
      status: 403,
      code: "FORBIDDEN",
    });
  });
});
