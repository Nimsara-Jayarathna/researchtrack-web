import { beforeEach, describe, expect, it, vi } from "vitest";

const setUser = vi.hoisted(() => vi.fn());
const clearAll = vi.hoisted(() => vi.fn());
const beginSessionTransition = vi.hoisted(() => vi.fn());
const resetSessionState = vi.hoisted(() => vi.fn());

vi.mock("@/app/config/env", () => ({
  env: { apiBaseUrl: "http://localhost:8081" },
}));

vi.mock("@/services/tokenStorage", () => ({
  tokenStorage: {
    getUser: vi.fn(),
    setUser,
    clearUser: vi.fn(),
    clearAll,
  },
}));

vi.mock("@/services/sessionState", () => ({
  beginSessionTransition,
  resetSessionState,
}));

import { ApiException, apiClient } from "@/services/apiClient";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function successEnvelope<T>(data: T) {
  return {
    success: true,
    data,
    meta: {
      traceId: "trace-1",
      timestamp: "2026-08-22T06:00:00Z",
    },
  };
}

function errorEnvelope(overrides: {
  message: string;
  code: string;
  fieldErrors?: Array<{ field: string; errors: string[] }>;
}) {
  return {
    success: false,
    error: {
      code: overrides.code,
      message: overrides.message,
      ...(overrides.fieldErrors ? { fieldErrors: overrides.fieldErrors } : {}),
    },
    meta: {
      traceId: "trace-2",
      timestamp: "2026-08-22T06:01:00Z",
    },
  };
}

describe("apiClient ResearchTrack .NET contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("unwraps the canonical .NET success envelope", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(
        200,
        successEnvelope({
          registrationToken: "token_abc",
          requiresRoleSelection: false,
          role: "SUPERVISOR",
        }),
      ),
    );

    const data = await apiClient.post<{
      registrationToken: string;
      requiresRoleSelection: boolean;
      role: string | null;
    }>("/api/v1/auth/register/verify", {
      email: "supervisor@sliit.lk",
      otp: "123456",
    });

    expect(data).toEqual({
      registrationToken: "token_abc",
      requiresRoleSelection: false,
      role: "SUPERVISOR",
    });
  });

  it("normalizes .NET fieldErrors for existing form components", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(
        400,
        errorEnvelope({
          code: "VALIDATION_ERROR",
          message: "Validation failed.",
          fieldErrors: [
            {
              field: "email",
              errors: ["Invalid IT number format. Use ITXXXXXXXX."],
            },
          ],
        }),
      ),
    );

    await expect(
      apiClient.post("/api/v1/auth/register/init", {
        email: "bad@my.sliit.lk",
      }),
    ).rejects.toMatchObject<ApiException>({
      apiError: expect.objectContaining({
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Validation failed.",
        path: "/api/v1/auth/register/init",
        traceId: "trace-2",
        details: [
          {
            field: "email",
            message: "Invalid IT number format. Use ITXXXXXXXX.",
          },
        ],
      }),
    } as ApiException);
  });

  it("does not attempt token refresh for canonical registration auth failures", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(
        401,
        errorEnvelope({
          code: "UNAUTHORIZED",
          message: "Registration session is invalid or expired.",
        }),
      ),
    );

    await expect(
      apiClient.post("/api/v1/auth/register/complete", {
        registrationToken: "expired",
      }),
    ).rejects.toMatchObject<ApiException>({
      apiError: expect.objectContaining({
        status: 401,
        code: "UNAUTHORIZED",
        message: "Registration session is invalid or expired.",
      }),
    } as ApiException);

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("still treats not-yet-migrated auth endpoints as public until Story 2", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(
        401,
        errorEnvelope({
          code: "UNAUTHORIZED",
          message: "Invalid email or password.",
        }),
      ),
    );

    await expect(
      apiClient.post("/api/auth/login", {
        email: "wrong@example.com",
        password: "wrong",
      }),
    ).rejects.toMatchObject<ApiException>({
      apiError: expect.objectContaining({
        status: 401,
        code: "UNAUTHORIZED",
        message: "Invalid email or password.",
      }),
    } as ApiException);

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("rejects 2xx responses that do not use the .NET envelope", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(200, { registrationToken: "raw-token" }),
    );

    await expect(
      apiClient.post("/api/v1/auth/register/verify", {
        email: "supervisor@sliit.lk",
        otp: "123456",
      }),
    ).rejects.toMatchObject<ApiException>({
      apiError: expect.objectContaining({
        code: "INTERNAL_ERROR",
        message: "The server returned an invalid response.",
      }),
    } as ApiException);
  });
});
