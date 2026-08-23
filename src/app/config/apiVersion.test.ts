import { describe, expect, it, vi } from "vitest";

vi.mock("./env", () => ({
  env: {
    apiBaseUrl: "http://localhost:8081",
    apiVersion: "v7",
  },
}));

import { API_PREFIX, API_VERSION, toVersionedApiPath } from "./apiVersion";

describe("API version contract", () => {
  it("reads the API version from environment configuration", () => {
    expect(API_VERSION).toBe("v7");
    expect(API_PREFIX).toBe("/api/v7");
  });

  it("adds the configured version to logical frontend API paths", () => {
    expect(toVersionedApiPath("/api/auth/register/config")).toBe(
      "/api/v7/auth/register/config",
    );
  });

  it("rejects versions embedded by feature code", () => {
    expect(() => toVersionedApiPath("/api/v2/auth/register")).toThrow(
      "API version must not be specified by feature code",
    );
  });

  it("rejects non-API paths", () => {
    expect(() => toVersionedApiPath("/auth/register")).toThrow(
      "API path must start with /api/",
    );
  });
});
