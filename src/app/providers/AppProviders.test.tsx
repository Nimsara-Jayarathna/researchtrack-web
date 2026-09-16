import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const bootstrapAuthSession = vi.hoisted(() => vi.fn());

vi.mock("@/features/auth/state/authBootstrap", () => ({
  bootstrapAuthSession,
}));

import { AppProviders } from "./AppProviders";

describe("AppProviders auth bootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    "/github/request-access?token=request-token",
    "/github/access-request/request-token",
    "/github/access-request/result?token=result-token",
    "/github/access-updated?token=result-token",
  ])("does not bootstrap /me on public GitHub route %s", async (path) => {
    window.history.replaceState({}, "", path);

    render(
      <AppProviders>
        <div>Public GitHub flow</div>
      </AppProviders>,
    );

    await waitFor(() => expect(bootstrapAuthSession).not.toHaveBeenCalled());
  });

  it("bootstraps the authenticated application", async () => {
    window.history.replaceState({}, "", "/supervisor/projects");

    render(
      <AppProviders>
        <div>Authenticated application</div>
      </AppProviders>,
    );

    await waitFor(() => expect(bootstrapAuthSession).toHaveBeenCalledTimes(1));
  });
});
