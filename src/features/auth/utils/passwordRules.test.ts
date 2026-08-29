import { describe, expect, it } from "vitest";
import type { PasswordPolicyConfig } from "../types";
import {
  getPasswordChecks,
  isPasswordPolicyPassed,
  resolvePasswordPolicy,
} from "./passwordRules";

describe("passwordRules", () => {
  it("uses backend policy flags instead of assuming every rule is enabled", () => {
    const policy: PasswordPolicyConfig = {
      minimumLength: 8,
      maximumLength: 32,
      requireUppercase: false,
      requireLowercase: true,
      requireDigit: false,
      requireSpecialCharacter: false,
    };

    const checks = getPasswordChecks("lowercase", policy);

    expect(checks).toEqual({
      minLength: true,
      maxLength: true,
      uppercase: true,
      lowercase: true,
      digit: true,
      specialCharacter: true,
    });
    expect(isPasswordPolicyPassed(checks)).toBe(true);
  });

  it("enforces configured maximum length", () => {
    const policy: PasswordPolicyConfig = {
      minimumLength: 4,
      maximumLength: 6,
      requireUppercase: false,
      requireLowercase: false,
      requireDigit: false,
      requireSpecialCharacter: false,
    };

    expect(getPasswordChecks("1234567", policy).maxLength).toBe(false);
  });

  it("keeps a stable safe fallback while server config is loading", () => {
    const policy = resolvePasswordPolicy(null);

    expect(policy.minimumLength).toBe(12);
    expect(policy.maximumLength).toBe(128);
    expect(policy.requireUppercase).toBe(true);
    expect(policy.requireLowercase).toBe(true);
    expect(policy.requireDigit).toBe(true);
    expect(policy.requireSpecialCharacter).toBe(true);
  });
});
