import { renderHook, waitFor } from "@testing-library/react";
import { useSupervisorProjectGitHubSetupRedirect } from "./useSupervisorProjectGitHubSetupRedirect";

const startGitHubAccessSourceInstall = vi.hoisted(() => vi.fn());
vi.mock("../../api/supervisorApi", () => ({
  supervisorApi: { startGitHubAccessSourceInstall },
}));

describe("useSupervisorProjectGitHubSetupRedirect", () => {
  beforeEach(() => vi.clearAllMocks());

  it("opens repository selection from a validated backend success and removes callback params", async () => {
    const setSearchParams = vi.fn();
    const showError = vi.fn();
    const { result } = renderHook(() =>
      useSupervisorProjectGitHubSetupRedirect({
        projectId: "project-1",
        searchParams: new URLSearchParams(
          "githubSetup=success&githubFlow=INSTALLATION_DIRECT&githubSourceId=source-1&installationId=42",
        ),
        setSearchParams: setSearchParams as never,
        refreshModal: { showError },
      }),
    );

    await waitFor(() =>
      expect(result.current.pendingGitHubSourceId).toBe("source-1"),
    );
    expect(result.current.pendingGitHubFlowType).toBe("INSTALLATION_DIRECT");
    expect(showError).not.toHaveBeenCalled();
    expect(setSearchParams).toHaveBeenCalled();
    expect(setSearchParams.mock.calls[0][0].get("tab")).toBe("integrations");
  });

  it("shows an understandable cancelled message with a retry action", async () => {
    const setSearchParams = vi.fn();
    const showError = vi.fn();
    renderHook(() =>
      useSupervisorProjectGitHubSetupRedirect({
        projectId: "project-1",
        searchParams: new URLSearchParams(
          "githubSetup=failed&githubFlow=INSTALLATION_DIRECT&githubError=cancelled",
        ),
        setSearchParams: setSearchParams as never,
        refreshModal: { showError },
      }),
    );

    await waitFor(() => expect(showError).toHaveBeenCalled());
    expect(showError.mock.calls[0][0]).toMatchObject({
      title: "GitHub connection cancelled",
      message: expect.stringContaining("No GitHub connection was created"),
      retryAction: expect.any(Function),
    });
  });

  it("shows GitHub unavailable state separately from cancellation", async () => {
    const showError = vi.fn();
    renderHook(() =>
      useSupervisorProjectGitHubSetupRedirect({
        projectId: "project-1",
        searchParams: new URLSearchParams(
          "githubSetup=failed&githubFlow=INSTALLATION_DIRECT&githubError=github_unavailable",
        ),
        setSearchParams: vi.fn() as never,
        refreshModal: { showError },
      }),
    );

    await waitFor(() =>
      expect(showError).toHaveBeenCalledWith(
        expect.objectContaining({ title: "GitHub is unavailable" }),
      ),
    );
  });
});
