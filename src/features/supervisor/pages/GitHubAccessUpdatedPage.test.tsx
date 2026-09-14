import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { GitHubAccessUpdatedPage } from "./GitHubAccessUpdatedPage";

const getPublicGitHubAccessUpdatedSummary = vi.hoisted(() => vi.fn());
const getProjectGitHubAccessUpdatedSummary = vi.hoisted(() => vi.fn());
const getGitHubRepositoryAccessRequestStatus = vi.hoisted(() => vi.fn());
const authStateValue = vi.hoisted(() => ({
  current: {
    status: "unauthenticated",
    user: null as null | { role: string },
    isLoading: false,
    error: null,
  },
}));

vi.mock("../api/supervisorApi", () => ({
  supervisorApi: {
    getPublicGitHubAccessUpdatedSummary,
    getProjectGitHubAccessUpdatedSummary,
    getGitHubRepositoryAccessRequestStatus,
  },
}));

vi.mock("@/features/auth/state/authState", () => ({
  useAuthStateValue: () => authStateValue.current,
}));

function renderPage(entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <GitHubAccessUpdatedPage />
    </MemoryRouter>,
  );
}

describe("GitHubAccessUpdatedPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStateValue.current = {
      status: "unauthenticated",
      user: null,
      isLoading: false,
      error: null,
    };
  });

  it("shows requested-flow success without opening unrestricted repository selection", async () => {
    renderPage(
      "/github/access-updated?githubSetup=success&githubFlow=INSTALLATION_REQUESTED&githubRequestId=request-1&githubSourceId=source-1",
    );

    expect(
      await screen.findByRole("heading", {
        name: "GitHub authorization returned",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No additional repository selection is required/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Review repositories" }),
    ).not.toBeInTheDocument();
    expect(getPublicGitHubAccessUpdatedSummary).not.toHaveBeenCalled();
    expect(getProjectGitHubAccessUpdatedSummary).not.toHaveBeenCalled();
  });

  it("offers the relevant project to the authenticated original requester", async () => {
    authStateValue.current = {
      status: "authenticated",
      user: { role: "SUPERVISOR" },
      isLoading: false,
      error: null,
    };
    getGitHubRepositoryAccessRequestStatus.mockResolvedValue({
      requestId: "request-1",
      projectId: "project-1",
      repositoryOwner: "openai",
      repositoryName: "example",
      repositoryFullName: "openai/example",
      repositoryUrl: "https://github.com/openai/example",
      status: "COMPLETED",
      expiresAt: "2026-09-14T12:00:00Z",
      failureCode: null,
    });

    renderPage(
      "/github/access-updated?githubSetup=success&githubFlow=INSTALLATION_REQUESTED&githubRequestId=request-1",
    );

    expect(
      await screen.findByText("Repository linked: openai/example"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Back to project" }),
    ).toBeInTheDocument();
    expect(getGitHubRepositoryAccessRequestStatus).toHaveBeenCalledWith(
      "request-1",
    );
  });

  it("does not turn a failed requested callback with a project query into success", async () => {
    renderPage(
      "/github/access-updated?githubSetup=failed&githubFlow=INSTALLATION_REQUESTED&projectId=project-1",
    );
    expect(
      await screen.findByRole("heading", {
        name: "GitHub access update failed",
      }),
    ).toBeInTheDocument();
    expect(getProjectGitHubAccessUpdatedSummary).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "Review repositories" }),
    ).not.toBeInTheDocument();
  });

  it.each(["PENDING", "FAILED", "EXPIRED"])(
    "does not claim completion when authenticated request status is %s",
    async (status) => {
      authStateValue.current = {
        status: "authenticated",
        user: { role: "SUPERVISOR" },
        isLoading: false,
        error: null,
      };
      getGitHubRepositoryAccessRequestStatus.mockResolvedValue({
        requestId: "request-1",
        projectId: "project-1",
        status,
        repositoryFullName: "openai/example",
      });
      renderPage(
        "/github/access-updated?githubSetup=success&githubFlow=INSTALLATION_REQUESTED&githubRequestId=request-1",
      );
      expect(
        await screen.findByRole("heading", {
          name: "Repository access is not completed",
        }),
      ).toBeInTheDocument();
      expect(
        screen.queryByText("Repository linked: openai/example"),
      ).not.toBeInTheDocument();
    },
  );

  it("preserves direct-flow repository review behavior", async () => {
    getProjectGitHubAccessUpdatedSummary.mockResolvedValue({
      projectId: "project-1",
      projectTitle: "ResearchTrack",
      installationId: 42,
      sourceId: "source-1",
      flowType: "INSTALLATION_DIRECT",
      accessScope: "SINGLE_REPOSITORY",
      accessibleRepositoryCount: 1,
      repositories: [
        {
          repositoryId: 1,
          name: "example",
          fullName: "openai/example",
          url: "https://github.com/openai/example",
          ownerLogin: "openai",
          defaultBranch: "main",
        },
      ],
    });

    renderPage(
      "/github/access-updated?status=success&flowType=INSTALLATION_DIRECT&projectId=project-1&sourceId=source-1",
    );

    expect(
      await screen.findByRole("button", { name: "Review repositories" }),
    ).toBeInTheDocument();
    expect(getProjectGitHubAccessUpdatedSummary).toHaveBeenCalledWith(
      "project-1",
    );
  });
});
