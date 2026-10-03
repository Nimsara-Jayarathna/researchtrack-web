import { describe, expect, it } from "vitest";
import {
  fileExtension,
  formatBytes,
  validateSubmissionFile,
} from "./submissionFiles";

describe("submissionFiles", () => {
  it("normalizes file extensions", () => {
    expect(fileExtension("chapter.DOCX")).toBe("docx");
    expect(fileExtension("no-extension")).toBe("");
  });

  it("rejects empty, oversized, and unsupported files", () => {
    const empty = new File([], "empty.pdf", { type: "application/pdf" });
    expect(validateSubmissionFile(empty, ["pdf"], 100)).toContain("empty");

    const oversized = new File(["abcd"], "large.pdf", {
      type: "application/pdf",
    });
    expect(validateSubmissionFile(oversized, ["pdf"], 2)).toContain("exceeds");

    const unsupported = new File(["x"], "image.png", {
      type: "image/png",
    });
    expect(validateSubmissionFile(unsupported, ["pdf"], 100)).toContain(
      "accepted file types",
    );
  });

  it("accepts a supported matching file", () => {
    const file = new File(["content"], "report.pdf", {
      type: "application/pdf",
    });
    expect(validateSubmissionFile(file, ["pdf", "docx"], 1024)).toBeNull();
  });

  it("formats byte limits for the UI", () => {
    expect(formatBytes(10 * 1024 * 1024)).toBe("10 MB");
  });
});
