import { describe, expect, it } from "vitest";
import type { ProjectGitHubPullRequest } from "../types";
import {
  getPullRequestDisplayStatus,
  getPullRequestLifecycleDate,
  getSafeGitHubUrl,
} from "./githubPullRequests";

function pr(overrides: Partial<ProjectGitHubPullRequest> = {}): ProjectGitHubPullRequest {
  return {
    gitHubPullRequestId: 1,
    number: 14,
    title: "Test PR",
    body: null,
    state: "OPEN",
    isDraft: false,
    isMerged: false,
    authorLogin: "dev",
    sourceBranch: "feature/test",
    targetBranch: "develop",
    createdAt: "2026-09-15T10:00:00Z",
    updatedAt: "2026-09-16T10:00:00Z",
    closedAt: null,
    mergedAt: null,
    htmlUrl: "https://github.com/example/repo/pull/14",
    additions: 10,
    deletions: 2,
    changedFiles: 3,
    commitsCount: 2,
    commentsCount: 0,
    reviewCommentsCount: 0,
    ...overrides,
  };
}

describe("GitHub pull request presentation", () => {
  it("gives merged and closed states precedence over draft", () => {
    expect(
      getPullRequestDisplayStatus(
        pr({ isMerged: true, isDraft: true, state: "CLOSED" }),
      ),
    ).toBe("merged");
    expect(
      getPullRequestDisplayStatus(pr({ isDraft: true, state: "CLOSED" })),
    ).toBe("closed");
  });

  it("uses merged/closed timestamps for lifecycle evidence", () => {
    expect(
      getPullRequestLifecycleDate(
        pr({ isMerged: true, state: "CLOSED", mergedAt: "2026-09-16T11:00:00Z" }),
      ),
    ).toEqual({ label: "Merged", value: "2026-09-16T11:00:00Z" });
  });

  it("only accepts HTTPS github.com detail links", () => {
    expect(getSafeGitHubUrl("https://github.com/example/repo/pull/14")).toContain(
      "github.com/example/repo/pull/14",
    );
    expect(getSafeGitHubUrl("javascript:alert(1)")).toBeNull();
    expect(getSafeGitHubUrl("https://example.com/phish")).toBeNull();
  });
});
