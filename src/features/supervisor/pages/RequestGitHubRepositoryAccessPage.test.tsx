import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RequestGitHubRepositoryAccessPage } from "./RequestGitHubRepositoryAccessPage";

const validatePublicGitHubRepositoryAccessRequest = vi.hoisted(() => vi.fn());
const continuePublicGitHubRepositoryAccessRequest = vi.hoisted(() => vi.fn());

vi.mock("../api/supervisorApi", () => ({
  supervisorApi: {
    validatePublicGitHubRepositoryAccessRequest,
    continuePublicGitHubRepositoryAccessRequest,
  },
}));

function renderPage(entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <RequestGitHubRepositoryAccessPage />
    </MemoryRouter>,
  );
}

describe("RequestGitHubRepositoryAccessPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates the public request before enabling Continue to GitHub and displays exact repository context", async () => {
    validatePublicGitHubRepositoryAccessRequest.mockResolvedValue({
      requestId: "request-1",
      repositoryOwner: "openai",
      repositoryName: "example",
      repositoryFullName: "openai/example",
      repositoryUrl: "https://github.com/openai/example",
      status: "PENDING",
      expiresAt: "2026-09-14T12:00:00Z",
      failureCode: null,
    });

    renderPage("/github/request-access?token=safe-token");

    expect(screen.getByRole("button", { name: /Validating/i })).toBeDisabled();
    expect(
      await screen.findByText("openai/example"),
    ).toBeInTheDocument();
    expect(screen.getByText("PENDING")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Continue to GitHub/i }),
    ).toBeEnabled();
    expect(validatePublicGitHubRepositoryAccessRequest).toHaveBeenCalledWith(
      "safe-token",
    );
  });

  it("shows an expired request as non-actionable", async () => {
    validatePublicGitHubRepositoryAccessRequest.mockResolvedValue({
      requestId: "request-1",
      repositoryOwner: "openai",
      repositoryName: "example",
      repositoryFullName: "openai/example",
      repositoryUrl: "https://github.com/openai/example",
      status: "EXPIRED",
      expiresAt: "2026-09-14T10:00:00Z",
      failureCode: "request_expired",
    });

    renderPage("/github/request-access?token=expired-token");

    expect(await screen.findByText("EXPIRED")).toBeInTheDocument();
    expect(
      screen.getByText(/repository access request has expired/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Continue to GitHub/i }),
    ).toBeDisabled();
    expect(continuePublicGitHubRepositoryAccessRequest).not.toHaveBeenCalled();
  });

  it("shows an invalid-link state without calling Continue", async () => {
    renderPage("/github/request-access");

    expect(
      screen.getByText(/access request link is invalid or unavailable/i),
    ).toBeInTheDocument();
    expect(validatePublicGitHubRepositoryAccessRequest).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /Continue to GitHub/i }),
    ).toBeDisabled();
  });

  it("shows an unavailable state when public token validation fails", async () => {
    validatePublicGitHubRepositoryAccessRequest.mockRejectedValue(
      new Error("unknown token"),
    );

    renderPage("/github/request-access?token=unknown-token");

    expect(
      await screen.findByText(/access request link is invalid or unavailable/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Continue to GitHub/i }),
    ).toBeDisabled();
    expect(continuePublicGitHubRepositoryAccessRequest).not.toHaveBeenCalled();
  });

  it("uses the validated request token when continuing to GitHub", async () => {
    validatePublicGitHubRepositoryAccessRequest.mockResolvedValue({
      requestId: "request-1",
      repositoryOwner: "openai",
      repositoryName: "example",
      repositoryFullName: "openai/example",
      repositoryUrl: "https://github.com/openai/example",
      status: "PENDING",
      expiresAt: "2026-09-14T12:00:00Z",
      failureCode: null,
    });
    continuePublicGitHubRepositoryAccessRequest.mockResolvedValue({
      requestId: "request-1",
      githubAuthorizeUrl: "https://evil.example/install",
      expiresAt: "2026-09-14T12:00:00Z",
    });

    renderPage("/github/request-access?token=safe-token");

    const continueButton = await screen.findByRole("button", {
      name: /Continue to GitHub/i,
    });
    await waitFor(() => expect(continueButton).toBeEnabled());
    fireEvent.click(continueButton);

    await waitFor(() =>
      expect(continuePublicGitHubRepositoryAccessRequest).toHaveBeenCalledWith(
        "safe-token",
      ),
    );
    expect(
      await screen.findByText(/GitHub authorization URL is invalid/i),
    ).toBeInTheDocument();
  });
});
