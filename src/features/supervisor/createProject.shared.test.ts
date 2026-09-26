import { describe, expect, it } from "vitest";
import {
  INITIAL_DRAFT,
  SEMESTER_OPTIONS,
  buildBatchYearOptions,
  isValidBatchYear,
  isValidSemester,
} from "./createProject.shared";

describe("project academic period options", () => {
  it("starts with no preselected batch or semester", () => {
    expect(INITIAL_DRAFT.batch).toBe("");
    expect(INITIAL_DRAFT.semester).toBe("");
  });

  it("builds five consecutive batch years from the supplied current year", () => {
    expect(buildBatchYearOptions(2026)).toEqual([
      "2026",
      "2027",
      "2028",
      "2029",
      "2030",
    ]);
  });

  it("accepts only generated batch years", () => {
    expect(isValidBatchYear("2026", 2026)).toBe(true);
    expect(isValidBatchYear("2030", 2026)).toBe(true);
    expect(isValidBatchYear("2025", 2026)).toBe(false);
    expect(isValidBatchYear("2031", 2026)).toBe(false);
  });

  it("accepts only the supported semesters", () => {
    expect(SEMESTER_OPTIONS).toEqual(["Semester 1", "Semester 2"]);
    expect(isValidSemester("Semester 1")).toBe(true);
    expect(isValidSemester("Semester 2")).toBe(true);
    expect(isValidSemester("Semester 3")).toBe(false);
    expect(isValidSemester("")).toBe(false);
  });
});
