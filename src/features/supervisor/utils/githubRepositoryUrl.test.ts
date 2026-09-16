import { describe, expect, it } from "vitest";
import { normalizeGitHubRepositoryUrl } from "./githubRepositoryUrl";

describe("normalizeGitHubRepositoryUrl", () => {
  it("normalizes canonical URL", () => {
    expect(
      normalizeGitHubRepositoryUrl(
        "https://github.com/Nimsara-Jayarathna/ResearchTrack-Frontend",
      ),
    ).toBe("https://github.com/Nimsara-Jayarathna/ResearchTrack-Frontend");
  });

  it("normalizes trailing slash and .git variants", () => {
    expect(
      normalizeGitHubRepositoryUrl(
        "https://github.com/Nimsara-Jayarathna/ResearchTrack-Frontend/",
      ),
    ).toBe("https://github.com/Nimsara-Jayarathna/ResearchTrack-Frontend");

    expect(
      normalizeGitHubRepositoryUrl(
        "https://github.com/Nimsara-Jayarathna/ResearchTrack-Frontend.git",
      ),
    ).toBe("https://github.com/Nimsara-Jayarathna/ResearchTrack-Frontend");
  });

  it("accepts host without scheme", () => {
    expect(
      normalizeGitHubRepositoryUrl(
        "github.com/Nimsara-Jayarathna/ResearchTrack-Frontend",
      ),
    ).toBe("https://github.com/Nimsara-Jayarathna/ResearchTrack-Frontend");
  });

  it.each([
    ["empty", ""],
    ["random string", "not a url"],
    ["unsupported host", "https://gitlab.com/owner/repository"],
    ["owner only", "https://github.com/owner"],
    ["issues route", "https://github.com/owner/repository/issues"],
    ["tree route", "https://github.com/owner/repository/tree/main"],
    ["credentials", "https://user:password@github.com/owner/repository"],
    ["malformed URL", "https://github.com/%/repository"],
    ["custom port", "https://github.com:444/owner/repository"],
    ["query", "https://github.com/owner/repository?tab=readme"],
    ["fragment", "https://github.com/owner/repository#readme"],
  ])("rejects %s", (_caseName, value) => {
    expect(normalizeGitHubRepositoryUrl(value)).toBeNull();
  });
});
