import { describe, expect, it } from "vitest";
import {
  abortRequestsByScope,
  createManagedAbortSignal,
} from "./requestRegistry";

describe("requestRegistry", () => {
  it("aborts only requests from the requested scope", () => {
    const session = createManagedAbortSignal("session");
    const publicRequest = createManagedAbortSignal("public");
    const transition = createManagedAbortSignal("auth-transition");

    expect(abortRequestsByScope("session", "test-reset")).toBe(1);
    expect(session.signal.aborted).toBe(true);
    expect(publicRequest.signal.aborted).toBe(false);
    expect(transition.signal.aborted).toBe(false);

    publicRequest.release();
    transition.release();
  });
});
