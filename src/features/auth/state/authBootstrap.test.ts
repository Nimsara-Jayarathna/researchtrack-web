import { beforeEach, describe, expect, it, vi } from "vitest";

const me = vi.hoisted(() => vi.fn());
const setUser = vi.hoisted(() => vi.fn());
const resetSessionState = vi.hoisted(() => vi.fn());
const setAuthenticatedUser = vi.hoisted(() => vi.fn());

vi.mock("../api/authApi", () => ({ authApi: { me } }));
vi.mock("@/services/tokenStorage", () => ({ tokenStorage: { setUser } }));
vi.mock("@/services/sessionState", () => ({ resetSessionState }));
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
    expect(resetSessionState).not.toHaveBeenCalled();
  });

  it("clears the client session when server session recovery fails", async () => {
    me.mockRejectedValue(new Error("unauthorized"));

    await bootstrapAuthSession();

    expect(resetSessionState).toHaveBeenCalledTimes(1);
    expect(setAuthenticatedUser).not.toHaveBeenCalled();
  });
});
