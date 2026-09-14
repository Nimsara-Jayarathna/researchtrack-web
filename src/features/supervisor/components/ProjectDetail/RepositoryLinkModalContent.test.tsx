import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { RepositoryLinkModalContent } from "./RepositoryLinkModalContent";
import type { GitHubRepositoryOption } from "../../types";

const repos: GitHubRepositoryOption[] = [
  {
    id: "repo-1",
    githubRepoId: 1,
    fullName: "org/one",
    name: "one",
    ownerLogin: "org",
    defaultBranch: "main",
    url: "https://github.com/org/one",
  },
  {
    id: "repo-2",
    githubRepoId: 2,
    fullName: "org/two",
    name: "two",
    ownerLogin: "org",
    defaultBranch: "main",
    url: "https://github.com/org/two",
  },
];

type Props = Parameters<typeof RepositoryLinkModalContent>[0];

function baseProps(overrides: Partial<Props> = {}): Props {
  return {
    step: "repository-selection",
    repositorySelectionEntryMode: "callback-direct",
    canReturnToMethods: false,
    selectedMethod: "INSTALLATION_DIRECT",
    onSelectMethod: () => undefined,
    onBackToMethods: () => undefined,
    onStartOwnerInstall: () => undefined,
    isStartingOwnerInstall: false,
    accessRequestOwnerLogin: "",
    onAccessRequestOwnerLoginChange: () => undefined,
    onCreateAccessRequest: () => undefined,
    isCreatingAccessRequest: false,
    accessRequests: [],
    isLoadingAccessRequests: false,
    revokingAccessRequestId: null,
    onReloadAccessRequests: () => undefined,
    onRevokeAccessRequest: () => undefined,
    generatedAccessRequestUrl: null,
    generatedAccessRequestExpiresAt: null,
    onCopyAccessRequestUrl: () => undefined,
    isAccessRequestLinkCopied: false,
    selectedSourceLabel: "GitHub",
    availableRepositories: repos,
    isLoadingAvailableRepositories: false,
    availableRepositoriesError: null,
    onReloadAvailableRepositories: () => undefined,
    selectedRepositoryIds: [],
    primaryRepositoryId: null,
    customNameByRepositoryId: {},
    maxSelectableCount: 1,
    onToggleRepository: () => undefined,
    onSetPrimaryRepository: () => undefined,
    onCustomNameChange: () => undefined,
    onConfirmRepositorySelection: () => undefined,
    isConfirmingRepositorySelection: false,
    ...overrides,
  };
}

function DirectHarness() {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <RepositoryLinkModalContent
      {...baseProps({
        selectedRepositoryIds: selected,
        primaryRepositoryId: selected[0] ?? null,
        onToggleRepository: (id) =>
          setSelected((current) =>
            current.includes(id)
              ? current.filter((item) => item !== id)
              : current.length < 1
                ? [id]
                : current,
          ),
      })}
    />
  );
}

describe("RepositoryLinkModalContent", () => {
  it("keeps direct GitHub App selection to one repository and uses singular labels", () => {
    render(<DirectHarness />);

    expect(screen.getByText("Select Repository")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Link Repository/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText("org/one"));
    expect(screen.getByText("Selected 1 / 1")).toBeInTheDocument();
    fireEvent.click(screen.getByText("org/two"));
    expect(screen.getByText("Selected 1 / 1")).toBeInTheDocument();
  });

  it("shows only GitHub App connection and access-request methods", () => {
    render(
      <RepositoryLinkModalContent
        {...baseProps({
          step: "method",
          repositorySelectionEntryMode: "manual",
          selectedMethod: null,
          maxSelectableCount: 5,
        })}
      />,
    );

    expect(screen.getByText("Connect GitHub")).toBeInTheDocument();
    expect(screen.getByText("Request Access")).toBeInTheDocument();
  });

  it("shows a clear empty state for an installation with no repositories", () => {
    render(
      <RepositoryLinkModalContent
        {...baseProps({ availableRepositories: [] })}
      />,
    );

    expect(
      screen.getByText(
        "No repositories are available to this GitHub installation.",
      ),
    ).toBeInTheDocument();
  });

  it("shows repository-load errors with a retry action", () => {
    const retry = vi.fn();
    render(
      <RepositoryLinkModalContent
        {...baseProps({
          availableRepositories: [],
          availableRepositoriesError: "GitHub is unavailable right now.",
          onReloadAvailableRepositories: retry,
        })}
      />,
    );

    expect(
      screen.getByText("GitHub is unavailable right now."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
