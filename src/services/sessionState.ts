import { clearInMemoryAuthState } from "@/features/auth/state/authState";
import { clearSessionCaches } from "./sessionCache";
import { tokenStorage } from "./tokenStorage";
import { abortRequestsByScope } from "./requestRegistry";

export type SessionTransitionReason = "login" | "logout" | "session-expired";

let sessionVersion = 0;

function logDev(message: string, payload?: Record<string, unknown>): void {
  if (!import.meta.env.DEV) {
    return;
  }
  if (payload) {
    // eslint-disable-next-line no-console
    console.info(`[sessionState] ${message}`, payload);
    return;
  }
  // eslint-disable-next-line no-console
  console.info(`[sessionState] ${message}`);
}

export function getSessionVersion(): number {
  return sessionVersion;
}

export function isCurrentSession(version: number): boolean {
  return sessionVersion === version;
}

export function beginSessionTransition(
  reason: SessionTransitionReason,
): number {
  sessionVersion += 1;
  logDev("session transition started", { reason, sessionVersion });
  return sessionVersion;
}

/**
 * Clears only authentication identity stored in memory/browser storage.
 * It deliberately does not abort requests or clear feature caches.
 */
export function clearAuthenticationState(): void {
  clearInMemoryAuthState();
  tokenStorage.clearAll();
}

/**
 * Resets an authenticated application session. Public and auth-transition
 * requests are intentionally preserved so password-reset/registration flows
 * cannot be cancelled by unrelated session changes.
 */
export function resetSessionState(): void {
  logDev("session reset start", { sessionVersion });

  clearInMemoryAuthState();
  const abortedRequests = abortRequestsByScope("session", "session-transition");
  const clearedCaches = clearSessionCaches();
  tokenStorage.clearAll();

  logDev("session reset complete", {
    sessionVersion,
    abortedRequests,
    clearedCaches,
  });
}
