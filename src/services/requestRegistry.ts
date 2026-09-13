let nextRequestId = 1;

export type RequestScope = "session" | "public" | "auth-transition";

type ManagedRequest = {
  controller: AbortController;
  scope: RequestScope;
};

const activeControllers = new Map<number, ManagedRequest>();

function logDev(message: string, payload?: Record<string, unknown>): void {
  if (!import.meta.env.DEV) {
    return;
  }
  if (payload) {
    // eslint-disable-next-line no-console
    console.info(`[requestRegistry] ${message}`, payload);
    return;
  }
  // eslint-disable-next-line no-console
  console.info(`[requestRegistry] ${message}`);
}

export function createManagedAbortSignal(scope: RequestScope = "session"): {
  id: number;
  signal: AbortSignal;
  release: () => void;
} {
  const id = nextRequestId++;
  const controller = new AbortController();
  activeControllers.set(id, { controller, scope });

  return {
    id,
    signal: controller.signal,
    release: () => {
      activeControllers.delete(id);
    },
  };
}

export function abortRequestsByScope(
  scope: RequestScope,
  reason = "session-transition",
): number {
  const entries = [...activeControllers.entries()].filter(
    ([, request]) => request.scope === scope,
  );

  for (const [id, request] of entries) {
    request.controller.abort(reason);
    activeControllers.delete(id);
  }

  logDev("aborted in-flight requests by scope", {
    reason,
    scope,
    count: entries.length,
  });
  return entries.length;
}

export function abortAllInFlightRequests(
  reason = "session-transition",
): number {
  const entries = [...activeControllers.entries()];
  for (const [id, request] of entries) {
    request.controller.abort(reason);
    activeControllers.delete(id);
  }

  logDev("aborted all in-flight requests", { reason, count: entries.length });
  return entries.length;
}
