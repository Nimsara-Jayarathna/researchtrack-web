import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiException } from "@/services/apiClient";

const me = vi.hoisted(() => vi.fn());
const setUser = vi.hoisted(() => vi.fn());
const clearAuthenticationState = vi.hoisted(() => vi.fn());
const setAuthenticatedUser = vi.hoisted(() => vi.fn());

vi.mock("../api/authApi", () => ({ authApi: { me } }));
vi.mock("@/services/tokenStorage", () => ({ tokenStorage: { setUser } }));
vi.mock("@/services/sessionState", () => ({ clearAuthenticationState }));
vi.mock("./authState", () => ({ setAuthenticatedUser }));

import { bootstrapAuthSession } from "./authBootstrap";

describe("bootstrapAuthSession", () => {
  beforeEach(() => vi.clearAllMocks());

  it("trusts /me rather than cached browser state", async () => {
    const user = {
      id: "user-id",
      email: "student@my.sliit.lk",
      firstName: "Student",
      lastName: "User",
      role: "STUDENT",
    };
    me.mockResolvedValue({ user });

    await bootstrapAuthSession();

    expect(setUser).toHaveBeenCalledWith(user);
    expect(setAuthenticatedUser).toHaveBeenCalledWith(user);
    expect(clearAuthenticationState).not.toHaveBeenCalled();
  });

  it("clears only local authentication state when server session recovery fails", async () => {
    me.mockRejectedValue(new Error("unavailable"));

    await bootstrapAuthSession();

    expect(clearAuthenticationState).toHaveBeenCalledTimes(1);
    expect(setAuthenticatedUser).not.toHaveBeenCalled();
  });

  it("ignores a cancelled bootstrap request", async () => {
    me.mockRejectedValue(
      new ApiException({
        timestamp: "2026-09-13T00:00:00Z",
        status: 499,
        error: "Client Closed Request",
        code: "INTERNAL_ERROR",
        message: "Request was cancelled.",
        path: "/api/v1/auth/me",
        traceId: null,
        details: [],
      }),
    );

    await bootstrapAuthSession();

    expect(clearAuthenticationState).not.toHaveBeenCalled();
    expect(setAuthenticatedUser).not.toHaveBeenCalled();
  });
});
