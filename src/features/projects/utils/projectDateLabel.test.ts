import { describe, expect, it } from "vitest";
import { projectDateLabel } from "./projectDateLabel";

describe("projectDateLabel", () => {
  it("converts valid date-only values into readable dates", () => {
    expect(projectDateLabel("2026-10-02")).toMatch(/Oct 2, 2026/);
  });
  it("does not fabricate dates for missing or invalid inputs", () => {
    expect(projectDateLabel(null)).toBe("Not set");
    expect(projectDateLabel("invalid")).toBe("invalid");
  });
});
