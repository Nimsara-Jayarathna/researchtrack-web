import type { ProjectGitHubRecentCommit } from "../types";

const DEVELOPMENT_ACTIVITY_TYPES = new Set([
  "COMMIT",
  "PUSH",
  "PULL_REQUEST_OPENED",
  "PULL_REQUEST_MERGED",
  "PULL_REQUEST_CLOSED",
]);

export function isDevelopmentActivity(activity: ProjectGitHubRecentCommit) {
  // Older commit-only responses omit type. Keep those commits visible.
  return DEVELOPMENT_ACTIVITY_TYPES.has(
    (activity.type ?? "COMMIT").toUpperCase(),
  );
}
