import { env } from "./env";

/**
 * Public ResearchTrack API contract version supplied by the deployment environment.
 *
 * Feature modules remain version-agnostic and call logical paths such as
 * `/api/auth/register`. The shared API client inserts this configured version at
 * the network boundary.
 */
export const API_VERSION = env.apiVersion;
export const API_PREFIX = `/api/${API_VERSION}`;

/**
 * Converts a logical frontend API path (for example `/api/auth/register`)
 * into the configured public gateway path (for example `/api/v1/auth/register`).
 */
export function toVersionedApiPath(path: string): string {
  if (path === "/api") {
    return API_PREFIX;
  }

  if (!path.startsWith("/api/")) {
    throw new Error(`API path must start with /api/: ${path}`);
  }

  // Feature code must not select its own version. The deployment ENV owns it.
  if (/^\/api\/v\d+(?:\/|$)/i.test(path)) {
    throw new Error(
      `API version must not be specified by feature code. Use logical /api/... paths: ${path}`,
    );
  }

  return `${API_PREFIX}${path.slice("/api".length)}`;
}
