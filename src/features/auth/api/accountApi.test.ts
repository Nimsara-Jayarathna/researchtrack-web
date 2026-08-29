import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAccountApi } from "./accountApi";

vi.mock("@/app/config/apiVersion", () => ({
  toVersionedApiPath: (path: string) => `/api/v1${path.slice("/api".length)}`,
}));

describe("accountApi change password", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses the canonical authenticated-user password endpoint", async () => {
    const apiClient = { patch: vi.fn().mockResolvedValue(undefined) };
    const api = createAccountApi({ apiClient: apiClient as never });
    const payload = {
      currentPassword: "CurrentPassword!1",
      newPassword: "NewStrongPassword!2",
    };

    await api.changePassword(payload);

    expect(apiClient.patch).toHaveBeenCalledWith(
      "/api/v1/users/me/password",
      payload,
    );
  });
});
