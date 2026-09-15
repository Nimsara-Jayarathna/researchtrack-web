import { expect, it } from "vitest";
import { isDevelopmentActivity } from "./developmentActivity";

it("filters by API type while preserving real commits regardless of their message", () => {
  const activity = {
    sha: "abc",
    message: "Rename repository from 'testrepo' to 'testrepo1'",
    author: "Author",
    committedAt: null,
  };
  expect(
    isDevelopmentActivity({ ...activity, type: "REPOSITORY_RENAMED" }),
  ).toBe(false);
  expect(isDevelopmentActivity({ ...activity, type: "commit" })).toBe(true);
  expect(
    isDevelopmentActivity({ ...activity, type: "PULL_REQUEST_MERGED" }),
  ).toBe(true);
  expect(isDevelopmentActivity(activity)).toBe(true);
});
