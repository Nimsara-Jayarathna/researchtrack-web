import { isApiException } from "@/services/apiClient";
import type { PaginatedListResult } from "../types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asArray<T>(value: unknown): T[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value as T[];
}

export function buildPagedUrl(path: string, page: number, size?: number) {
  const query = new URLSearchParams();
  if (page > 1) {
    query.set("page", String(page));
  }
  if (typeof size === "number" && Number.isFinite(size) && size > 0) {
    query.set("size", String(size));
  }
  const queryString = query.toString();
  return queryString.length > 0 ? `${path}?${queryString}` : path;
}

export function normalizePaginatedPayload<T>(
  payload: unknown,
  page: number,
  size?: number,
): PaginatedListResult<T> {
  const requestedSize = Number.isFinite(size) && size && size > 0 ? size : 10;

  if (Array.isArray(payload)) {
    return {
      items: payload as T[],
      hasMore: payload.length >= requestedSize,
      page,
      size: requestedSize,
      total: payload.length,
    };
  }

  if (!isRecord(payload)) {
    return { items: [], hasMore: false, page, size: requestedSize, total: 0 };
  }

  const items = asArray<T>(payload.items);
  const responsePage =
    typeof payload.page === "number" && Number.isFinite(payload.page)
      ? payload.page
      : page;
  const responseSize =
    typeof payload.size === "number" &&
    Number.isFinite(payload.size) &&
    payload.size > 0
      ? payload.size
      : requestedSize;
  const total =
    typeof payload.total === "number" && Number.isFinite(payload.total)
      ? payload.total
      : items.length;
  const hasMore =
    typeof payload.hasMore === "boolean"
      ? payload.hasMore
      : responsePage * responseSize < total;

  return { items, hasMore, page: responsePage, size: responseSize, total };
}

export function fallbackSlicePage<T>(
  allItems: T[],
  page: number,
  size?: number,
): PaginatedListResult<T> {
  const effectiveSize = Number.isFinite(size) && size && size > 0 ? size : 10;
  const start = (page - 1) * effectiveSize;
  const end = start + effectiveSize;
  const items = allItems.slice(start, end);
  return {
    items,
    hasMore: end < allItems.length,
    page,
    size: effectiveSize,
  };
}

export function shouldFallbackToDashboard(error: unknown) {
  return (
    isApiException(error) &&
    (error.apiError.code === "NOT_FOUND" || error.apiError.status === 404)
  );
}
