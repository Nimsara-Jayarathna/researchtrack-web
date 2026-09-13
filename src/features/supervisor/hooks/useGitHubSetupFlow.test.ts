import {
  parseGitHubSetupRedirect,
  redirectToGitHubOwnerInstall,
} from "./useGitHubSetupFlow";

const startGitHubAccessSourceInstall = vi.hoisted(() => vi.fn());
vi.mock("../api/supervisorApi", () => ({
  supervisorApi: { startGitHubAccessSourceInstall },
}));

describe("GitHub setup flow", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls install-start and redirects only to the backend-provided GitHub URL", async () => {
    const redirect = vi.fn();
    startGitHubAccessSourceInstall.mockResolvedValue({
      projectId: "project-1",
      githubAuthorizeUrl:
        "https://github.com/apps/researchtrack/installations/new?state=safe",
      flowType: "INSTALLATION_DIRECT",
      expiresAt: "2026-09-12T06:00:00Z",
    });

    await redirectToGitHubOwnerInstall("project-1", redirect);

    expect(startGitHubAccessSourceInstall).toHaveBeenCalledWith({
      projectId: "project-1",
    });
    expect(redirect).toHaveBeenCalledWith(
      "https://github.com/apps/researchtrack/installations/new?state=safe",
    );
  });

  it("rejects a non-GitHub redirect URL returned by the backend", async () => {
    const redirect = vi.fn();
    startGitHubAccessSourceInstall.mockResolvedValue({
      projectId: "project-1",
      githubAuthorizeUrl: "https://evil.example/install",
      flowType: "INSTALLATION_DIRECT",
      expiresAt: "2026-09-12T06:00:00Z",
    });

    await expect(
      redirectToGitHubOwnerInstall("project-1", redirect),
    ).rejects.toThrow("GitHub authorize URL is invalid.");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("parses successful and cancelled backend callback context without treating it as proof", () => {
    const success = parseGitHubSetupRedirect(
      new URLSearchParams(
        "githubSetup=success&githubFlow=INSTALLATION_DIRECT&githubSourceId=source-1&installationId=42",
      ),
    );
    expect(success).toMatchObject({
      setupStatus: "success",
      sourceId: "source-1",
      installationId: 42,
      flowType: "INSTALLATION_DIRECT",
      errorCode: null,
    });

    const cancelled = parseGitHubSetupRedirect(
      new URLSearchParams(
        "githubSetup=failed&githubFlow=INSTALLATION_DIRECT&githubError=cancelled",
      ),
    );
    expect(cancelled).toMatchObject({
      setupStatus: "failed",
      flowType: "INSTALLATION_DIRECT",
      errorCode: "cancelled",
    });
  });
});
