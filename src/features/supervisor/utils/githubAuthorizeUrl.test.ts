import { describe, expect, it } from "vitest";
import { isTrustedGitHubInstallationUrl } from "./githubAuthorizeUrl";

describe("isTrustedGitHubInstallationUrl", () => {
  it("accepts the canonical GitHub App installation URL", () => {
    expect(
      isTrustedGitHubInstallationUrl(
        "https://github.com/apps/researchtrack/installations/new?state=safe-state",
      ),
    ).toBe(true);
  });

  it.each([
    "http://github.com/apps/researchtrack/installations/new?state=safe-state",
    "https://evil.example/apps/researchtrack/installations/new?state=safe-state",
    "https://gist.github.com/apps/researchtrack/installations/new?state=safe-state",
    "https://github.com/login?return_to=https%3A%2F%2Fevil.example&state=safe-state",
    "https://github.com/apps/researchtrack/installations/new?state=safe-state&next=https://evil.example",
    "https://github.com/apps/researchtrack/installations/new",
  ])("rejects non-canonical authorization URL %s", (url) => {
    expect(isTrustedGitHubInstallationUrl(url)).toBe(false);
  });
});
