import type { PasswordPolicyConfig } from "../types";

export type PasswordChecks = {
  minLength: boolean;
  maxLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  digit: boolean;
  specialCharacter: boolean;
};

export type PasswordStrength = "weak" | "fair" | "strong";

export const DEFAULT_PASSWORD_POLICY: PasswordPolicyConfig = {
  minimumLength: 12,
  maximumLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecialCharacter: true,
};

// Kept for callers that only need a stable fallback before server config loads.
export const PASSWORD_MIN_LENGTH = DEFAULT_PASSWORD_POLICY.minimumLength;
export const PASSWORD_MAX_LENGTH = DEFAULT_PASSWORD_POLICY.maximumLength;

export function resolvePasswordPolicy(
  policy?: PasswordPolicyConfig | null,
): PasswordPolicyConfig {
  return policy ?? DEFAULT_PASSWORD_POLICY;
}

export function getPasswordChecks(
  password: string,
  policy?: PasswordPolicyConfig | null,
): PasswordChecks {
  const normalized = password ?? "";
  const resolved = resolvePasswordPolicy(policy);

  return {
    minLength: normalized.length >= resolved.minimumLength,
    maxLength: normalized.length <= resolved.maximumLength,
    uppercase: !resolved.requireUppercase || /\p{Lu}/u.test(normalized),
    lowercase: !resolved.requireLowercase || /\p{Ll}/u.test(normalized),
    digit: !resolved.requireDigit || /\p{Nd}/u.test(normalized),
    specialCharacter:
      !resolved.requireSpecialCharacter || /[^\p{L}\p{Nd}]/u.test(normalized),
  };
}

export function getPassedRuleCount(checks: PasswordChecks): number {
  return Object.values(checks).filter(Boolean).length;
}

export function getPasswordStrengthFromChecks(
  checks: PasswordChecks,
): PasswordStrength {
  if (isPasswordPolicyPassed(checks)) return "strong";

  const passed = getPassedRuleCount(checks);
  return passed >= Math.ceil(Object.keys(checks).length / 2) ? "fair" : "weak";
}

export function isPasswordPolicyPassed(checks: PasswordChecks): boolean {
  return Object.values(checks).every(Boolean);
}

export function getPasswordStrength(
  password: string,
  policy?: PasswordPolicyConfig | null,
): PasswordStrength {
  return getPasswordStrengthFromChecks(getPasswordChecks(password, policy));
}
