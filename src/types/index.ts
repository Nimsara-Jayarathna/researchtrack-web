/** Stable error codes consumed by existing frontend UI. */
export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "TOO_MANY_REQUESTS"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

/** Canonical error codes emitted by ResearchTrack.BuildingBlocks.Api. */
export type BackendApiErrorCode =
  | "VALIDATION_ERROR"
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "DEPENDENCY_UNAVAILABLE"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

/** Metadata emitted by ResearchTrack.BuildingBlocks.Api. */
export type ApiMeta = {
  timestamp: string;
  traceId: string | null;
};

/** Field-level validation error returned by the .NET API. */
export type ApiFieldError = {
  field: string;
  errors: string[];
};

/** Error payload inside the canonical ResearchTrack API envelope. */
export type ApiErrorBody = {
  code: BackendApiErrorCode;
  message: string;
  fieldErrors?: ApiFieldError[];
  details?: unknown;
};

/** Existing frontend field-error shape consumed by forms/components. */
export type ApiErrorDetail = {
  field: string;
  issue?: string;
  message?: string;
};

/** Normalized frontend error consumed by hooks/components. */
export type ApiError = {
  code: ApiErrorCode;
  status: number;
  message: string;
  details: ApiErrorDetail[];
  error?: string;
  timestamp: string;
  path: string;
  traceId: string | null;
};

/** Canonical response envelope returned by ResearchTrack.BuildingBlocks.Api. */
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: ApiErrorBody;
  meta: ApiMeta;
};
