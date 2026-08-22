import { describe, expect, it } from "vitest";
import { validateLoginForm } from "./loginValidation";

describe("login validation", () => {
  it("requires email and password", () => {
    expect(validateLoginForm("", "")).toEqual({
      email: "Email is required.",
      password: "Password is required.",
    });
  });

  it("does not enforce registration password-strength rules during login", () => {
    expect(validateLoginForm("student@my.sliit.lk", "x")).toEqual({});
  });
});
