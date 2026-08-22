import { env } from "@/app/config/env";
import type {
  ApiError,
  ApiErrorBody,
  ApiErrorCode,
  BackendApiErrorCode,
  ApiMeta,
  ApiResponse,
} from "@/types";
import { tokenStorage } from "./tokenStorage";
import type { StoredUser } from "./tokenStorage";
import { beginSessionTransition, resetSessionState } from "./sessionState";
import { createManagedAbortSignal } from "./requestRegistry";

export class ApiException extends Error {
  readonly apiError: ApiError;

  constructor(apiError: ApiError) {
    super(apiError.message);
    this.name = "ApiException";
    this.apiError = apiError;
  }
}

export function isApiException(error: unknown): error is ApiException {
  return error instanceof ApiException;
}

// Story 2 will migrate these authentication endpoints to /api/v1/auth/*.
// Registration is already canonical, so both prefixes are treated as public
// auth endpoints to avoid an incorrect refresh attempt on registration 401s.
const REFRESH_PATH = "/api/auth/refresh";
const AUTH_PATH_PREFIXES = ["/api/auth/", "/api/v1/auth/"] as const;
let inFlightRefresh: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  try {
    const response = await fetch(`${env.apiBaseUrl}${REFRESH_PATH}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!response.ok) return false;

    const body = (await response.json()) as unknown;
    if (!hasApiEnvelopeShape(body) || body.success !== true) return false;

    const data = body.data as { user?: StoredUser } | undefined;
    if (data?.user) tokenStorage.setUser(data.user);
    return true;
  } catch {
    return false;
  }
}

async function tryRefreshSingleFlight(): Promise<boolean> {
  if (inFlightRefresh) return inFlightRefresh;
  inFlightRefresh = tryRefresh().finally(() => {
    inFlightRefresh = null;
  });
  return inFlightRefresh;
}

function isAuthEndpoint(path: string): boolean {
  return AUTH_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

async function parseJsonSafely(response: Response): Promise<unknown | null> {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasApiMetaShape(value: unknown): value is ApiMeta {
  return (
    isRecord(value) &&
    typeof value.timestamp === "string" &&
    (typeof value.traceId === "string" || value.traceId === null)
  );
}

function hasApiErrorBodyShape(value: unknown): value is ApiErrorBody {
  if (!isRecord(value)) return false;
  if (typeof value.code !== "string" || typeof value.message !== "string") {
    return false;
  }

  if ("fieldErrors" in value && value.fieldErrors !== undefined) {
    if (!Array.isArray(value.fieldErrors)) return false;
    for (const fieldError of value.fieldErrors) {
      if (
        !isRecord(fieldError) ||
        typeof fieldError.field !== "string" ||
        !Array.isArray(fieldError.errors) ||
        !fieldError.errors.every((error) => typeof error === "string")
      ) {
        return false;
      }
    }
  }

  return true;
}

function hasApiEnvelopeShape(value: unknown): value is ApiResponse<unknown> {
  if (!isRecord(value) || typeof value.success !== "boolean") return false;
  if (!hasApiMetaShape(value.meta)) return false;
  return value.success ? "data" in value : hasApiErrorBodyShape(value.error);
}

function normalizeFieldErrors(body: ApiErrorBody): ApiError["details"] {
  return (body.fieldErrors ?? []).flatMap((fieldError) =>
    fieldError.errors.map((message) => ({
      field: fieldError.field,
      message,
      issue: message,
    })),
  );
}

function fallbackCode(status: number): ApiErrorCode {
  switch (status) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 429:
      return "TOO_MANY_REQUESTS";
    case 502:
    case 503:
      return "SERVICE_UNAVAILABLE";
    default:
      return "INTERNAL_ERROR";
  }
}


function normalizeBackendErrorCode(
  code: BackendApiErrorCode,
): ApiErrorCode {
  if (code === "RATE_LIMITED") return "TOO_MANY_REQUESTS";
  if (code === "DEPENDENCY_UNAVAILABLE") return "SERVICE_UNAVAILABLE";
  return code;
}

function createFallbackError(
  path: string,
  status: number,
  statusText: string,
): ApiError {
  return {
    timestamp: new Date().toISOString(),
    status,
    error:
      statusText || (status === 401 ? "Unauthorized" : "Internal Server Error"),
    code: fallbackCode(status),
    message:
      status === 401
        ? "Authentication failed."
        : "An unexpected error occurred.",
    path,
    traceId: null,
    details: [],
  };
}

function normalizeError(
  path: string,
  response: Response,
  body: unknown,
): ApiError {
  if (
    hasApiEnvelopeShape(body) &&
    body.success === false &&
    hasApiErrorBodyShape(body.error)
  ) {
    return {
      timestamp: body.meta.timestamp,
      status: response.status,
      error:
        response.statusText ||
        (response.status === 401 ? "Unauthorized" : "Request Failed"),
      code: normalizeBackendErrorCode(body.error.code),
      message: body.error.message,
      path,
      traceId: body.meta.traceId,
      details: normalizeFieldErrors(body.error),
    };
  }

  return createFallbackError(path, response.status, response.statusText);
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  const managed = createManagedAbortSignal();
  let response: Response;

  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      ...init,
      signal: managed.signal,
      headers,
      credentials: "include",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiException({
        timestamp: new Date().toISOString(),
        status: 499,
        error: "Client Closed Request",
        code: "INTERNAL_ERROR",
        message: "Request was cancelled.",
        path,
        traceId: null,
        details: [],
      });
    }

    throw new ApiException({
      timestamp: new Date().toISOString(),
      status: 503,
      error: "Service Unavailable",
      code: "SERVICE_UNAVAILABLE",
      message:
        "Unable to reach the server. Please check your connection and try again.",
      path,
      traceId: null,
      details: [],
    });
  } finally {
    managed.release();
  }

  if (response.status === 401 && !isAuthEndpoint(path) && !isRetry) {
    const refreshed = await tryRefreshSingleFlight();
    if (refreshed) return request<T>(path, init, true);

    beginSessionTransition("session-expired");
    resetSessionState();
    window.location.href = "/login";
    throw new ApiException({
      timestamp: new Date().toISOString(),
      status: 401,
      error: "Unauthorized",
      code: "UNAUTHORIZED",
      message: "Your session has expired. Please log in again.",
      path,
      traceId: null,
      details: [],
    });
  }

  if (response.status === 204) return undefined as unknown as T;

  const body = await parseJsonSafely(response);

  if (!response.ok) {
    throw new ApiException(normalizeError(path, response, body));
  }

  if (!hasApiEnvelopeShape(body)) {
    throw new ApiException({
      timestamp: new Date().toISOString(),
      status: response.status,
      error: "Invalid API Response",
      code: "INTERNAL_ERROR",
      message: "The server returned an invalid response.",
      path,
      traceId: null,
      details: [],
    });
  }

  if (body.success === false) {
    throw new ApiException(normalizeError(path, response, body));
  }

  return body.data as T;
}

export const apiClient = {
  get<T>(path: string): Promise<T> {
    return request<T>(path, { method: "GET" });
  },
  post<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, { method: "POST", body: JSON.stringify(body) });
  },
  put<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, { method: "PUT", body: JSON.stringify(body) });
  },
  patch<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
  },
  del<T>(path: string): Promise<T> {
    return request<T>(path, { method: "DELETE" });
  },
};
