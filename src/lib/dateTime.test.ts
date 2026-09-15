import { describe, expect, it } from "vitest";
import { parseApiDate } from "./dateTime";

describe("parseApiDate", () => {
  it.each([
    "2026-09-15T05:44:42",
    " 2026-09-15T05:44:42 ",
    "2026-09-15T05:44:42Z",
    "2026-09-15T11:14:42+05:30",
    "2026-09-15T11:14:42+0530",
  ])("normalizes %s to the same UTC instant", (value) => {
    expect(parseApiDate(value).toISOString()).toBe("2026-09-15T05:44:42.000Z");
  });

  it("preserves Date objects", () => {
    const date = new Date("2026-09-15T05:44:42Z");
    expect(parseApiDate(date)).toBe(date);
  });

  it("leaves invalid input invalid", () => {
    expect(Number.isNaN(parseApiDate("not-a-date").getTime())).toBe(true);
  });
});
