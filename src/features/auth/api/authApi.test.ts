import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock("../../../services/apiClient", () => ({
  apiClient: apiClientMock,
}));

async function loadAuthApi() {
  const module = await import("./authApi");
  return module.authApi;
}

describe("authApi registration endpoints", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("uses canonical Story 2 login, refresh, logout, and me endpoints", async () => {
    const authApi = await loadAuthApi();
    vi.mocked(apiClientMock.post).mockResolvedValue({
      user: {
        id: "user-id",
        email: "student@my.sliit.lk",
        firstName: "Student",
        lastName: "User",
        role: "STUDENT",
      },
    });
    vi.mocked(apiClientMock.get).mockResolvedValue({
      user: {
        id: "user-id",
        email: "student@my.sliit.lk",
        firstName: "Student",
        lastName: "User",
        role: "STUDENT",
      },
    });

    await authApi.login({
      email: "student@my.sliit.lk",
      password: "password",
    });
    await authApi.refresh();
    await authApi.logout();
    await authApi.me();

    expect(apiClientMock.post).toHaveBeenCalledWith("/api/v1/auth/login", {
      email: "student@my.sliit.lk",
      password: "password",
    });
    expect(apiClientMock.post).toHaveBeenCalledWith("/api/v1/auth/refresh", {});
    expect(apiClientMock.post).toHaveBeenCalledWith("/api/v1/auth/logout", {});
    expect(apiClientMock.get).toHaveBeenCalledWith("/api/v1/auth/me");
  });

  it("uses /api/v1/auth/register for direct student registration", async () => {
    const authApi = await loadAuthApi();
    const payload = {
      firstName: "Nimal",
      lastName: "Perera",
      email: "IT24100487@my.sliit.lk",
      password: "SecurePassword123",
      registrationNumber: "IT24100487",
    };

    vi.mocked(apiClientMock.post).mockResolvedValue({});
    await authApi.register(payload);

    expect(apiClientMock.post).toHaveBeenCalledWith(
      "/api/v1/auth/register",
      payload,
    );
  });

  it("uses the same canonical endpoint for direct supervisor registration", async () => {
    const authApi = await loadAuthApi();
    const payload = {
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe@sliit.lk",
      password: "SecurePassword123",
    };

    vi.mocked(apiClientMock.post).mockResolvedValue({});
    await authApi.registerSupervisor(payload);

    expect(apiClientMock.post).toHaveBeenCalledWith(
      "/api/v1/auth/register",
      payload,
    );
  });

  it("uses /api/v1/auth/register/init", async () => {
    const authApi = await loadAuthApi();
    const payload = { email: "jane.doe@sliit.lk" };

    vi.mocked(apiClientMock.post).mockResolvedValue({
      message: "OTP sent successfully",
    });
    await authApi.registerInit(payload);

    expect(apiClientMock.post).toHaveBeenCalledWith(
      "/api/v1/auth/register/init",
      payload,
    );
  });

  it("uses /api/v1/auth/register/verify and preserves the token", async () => {
    const authApi = await loadAuthApi();
    const payload = { email: "jane.doe@sliit.lk", otp: "123456" };

    vi.mocked(apiClientMock.post).mockResolvedValue({
      registrationToken: "token_abc",
      requiresRoleSelection: false,
      role: "SUPERVISOR",
    });

    const result = await authApi.registerVerify(payload);

    expect(apiClientMock.post).toHaveBeenCalledWith(
      "/api/v1/auth/register/verify",
      payload,
    );
    expect(result.registrationToken).toBe("token_abc");
  });

  it("passes the token unchanged to /api/v1/auth/register/complete", async () => {
    const authApi = await loadAuthApi();
    const payload = {
      registrationToken: "token_abc",
      fname: "Jane",
      lname: "Doe",
      password: "SecurePassword123",
    };

    vi.mocked(apiClientMock.post).mockResolvedValue({
      user: {
        id: "user-id",
        email: "jane.doe@sliit.lk",
        firstName: "Jane",
        lastName: "Doe",
        role: "SUPERVISOR",
      },
    });
    await authApi.registerComplete(payload);

    expect(apiClientMock.post).toHaveBeenCalledWith(
      "/api/v1/auth/register/complete",
      payload,
    );
  });

  it("uses /api/v1/auth/register/config and returns the .NET config", async () => {
    const authApi = await loadAuthApi();
    const config = {
      domainRestrictionEnabled: true,
      studentDomain: "@my.sliit.lk",
      supervisorDomain: "@sliit.lk",
      studentEmailPrefixRestrictionEnabled: true,
      studentEmailPrefixRegex: "^IT(1[5-9]|[2-4][0-9]|50)[0-9]{6}$",
      requireStudentRegistrationNumber: true,
      requireStudentRegistrationNumberToMatchEmail: true,
      passwordPolicy: {
        minimumLength: 12,
        maximumLength: 128,
        requireUppercase: false,
        requireLowercase: false,
        requireDigit: false,
        requireSpecialCharacter: false,
      },
    };

    vi.mocked(apiClientMock.get).mockResolvedValue(config);
    const result = await authApi.getRegisterConfig();

    expect(apiClientMock.get).toHaveBeenCalledWith(
      "/api/v1/auth/register/config",
    );
    expect(result).toEqual(config);
  });

  it("deduplicates concurrent registration config requests", async () => {
    const authApi = await loadAuthApi();
    const config = {
      domainRestrictionEnabled: true,
      studentDomain: "@my.sliit.lk",
      supervisorDomain: "@sliit.lk",
      studentEmailPrefixRestrictionEnabled: true,
      studentEmailPrefixRegex: "^IT",
    };

    let resolveConfig: ((value: typeof config) => void) | null = null;
    vi.mocked(apiClientMock.get).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveConfig = resolve;
        }),
    );

    const first = authApi.getRegisterConfig();
    const second = authApi.getRegisterConfig();
    expect(apiClientMock.get).toHaveBeenCalledTimes(1);

    resolveConfig?.(config);
    await expect(first).resolves.toEqual(config);
    await expect(second).resolves.toEqual(config);
  });

  it("clears the config cache after a failed request", async () => {
    const authApi = await loadAuthApi();
    const config = {
      domainRestrictionEnabled: true,
      studentDomain: "@my.sliit.lk",
      supervisorDomain: "@sliit.lk",
      studentEmailPrefixRestrictionEnabled: true,
      studentEmailPrefixRegex: "^IT",
    };

    vi.mocked(apiClientMock.get)
      .mockRejectedValueOnce(new Error("transient failure"))
      .mockResolvedValueOnce(config);

    await expect(authApi.getRegisterConfig()).rejects.toThrow(
      "transient failure",
    );
    await expect(authApi.getRegisterConfig()).resolves.toEqual(config);
    expect(apiClientMock.get).toHaveBeenCalledTimes(2);
  });
});
