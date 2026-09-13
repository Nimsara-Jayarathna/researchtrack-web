import { beforeEach, describe, expect, it, vi } from "vitest";

const clearInMemoryAuthState = vi.hoisted(() => vi.fn());
const clearSessionCaches = vi.hoisted(() => vi.fn(() => 3));
const clearAll = vi.hoisted(() => vi.fn());
const abortRequestsByScope = vi.hoisted(() => vi.fn(() => 2));

vi.mock("@/features/auth/state/authState", () => ({
  clearInMemoryAuthState,
}));

vi.mock("./sessionCache", () => ({
  clearSessionCaches,
}));

vi.mock("./tokenStorage", () => ({
  tokenStorage: {
    clearAll,
  },
}));

vi.mock("./requestRegistry", () => ({
  abortRequestsByScope,
}));

describe("sessionState", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("increments session version immediately on transition start", async () => {
    const { beginSessionTransition, getSessionVersion } =
      await import("./sessionState");

    const previous = getSessionVersion();
    const next = beginSessionTransition("login");

    expect(next).toBe(previous + 1);
    expect(getSessionVersion()).toBe(next);
  });

  it("clears authentication state without aborting requests or clearing caches", async () => {
    const { clearAuthenticationState } = await import("./sessionState");

    clearAuthenticationState();

    expect(clearInMemoryAuthState).toHaveBeenCalledTimes(1);
    expect(clearAll).toHaveBeenCalledTimes(1);
    expect(abortRequestsByScope).not.toHaveBeenCalled();
    expect(clearSessionCaches).not.toHaveBeenCalled();
  });

  it("resets authenticated session state in deterministic order", async () => {
    const order: string[] = [];

    clearInMemoryAuthState.mockImplementation(() => {
      order.push("auth");
    });
    abortRequestsByScope.mockImplementation(() => {
      order.push("abort");
      return 2;
    });
    clearSessionCaches.mockImplementation(() => {
      order.push("cache");
      return 3;
    });
    clearAll.mockImplementation(() => {
      order.push("storage");
    });

    const { resetSessionState } = await import("./sessionState");
    resetSessionState();

    expect(order).toEqual(["auth", "abort", "cache", "storage"]);
    expect(abortRequestsByScope).toHaveBeenCalledWith(
      "session",
      "session-transition",
    );
  });
});
