import { describe, expect, it } from "vitest";
import { hashJiraIdentity, jiraInitials } from "./JiraVisuals";

describe("Jira contributor identity", () => {
  it("produces stable hashes for the same normalized identity", () => {
    const identity = "5b10ac8d82e05b22cc7d4ef5";
    expect(hashJiraIdentity(identity)).toBe(hashJiraIdentity(identity));
  });

  it("creates stable initials from display names", () => {
    expect(jiraInitials("Pamudi Abhayarathne")).toBe("PA");
    expect(jiraInitials("Sachith Asmadala")).toBe("SA");
  });
});
