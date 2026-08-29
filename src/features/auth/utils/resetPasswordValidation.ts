import type { ApiError } from "@/types";
import type { PasswordPolicyConfig } from "../types";
import {
  getPasswordChecks,
  isPasswordPolicyPassed,
  resolvePasswordPolicy,
} from "./passwordRules";

export type ResetPasswordFieldErrors = {
  newPassword?: string;
  confirmNewPassword?: string;
};

export function validateResetPasswordForm(
  fields: {
    newPassword: string;
    confirmNewPassword: string;
  },
  passwordPolicy?: PasswordPolicyConfig | null,
): ResetPasswordFieldErrors {
  const { newPassword, confirmNewPassword } = fields;
  const errors: ResetPasswordFieldErrors = {};
  const resolvedPolicy = resolvePasswordPolicy(passwordPolicy);
  const checks = getPasswordChecks(newPassword, resolvedPolicy);

  if (!newPassword) errors.newPassword = "Password is required.";
  else if (!isPasswordPolicyPassed(checks))
    errors.newPassword =
      "Password does not satisfy the required security policy.";

  if (!confirmNewPassword)
    errors.confirmNewPassword = "Please confirm your password.";
  else if (newPassword !== confirmNewPassword)
    errors.confirmNewPassword = "Passwords do not match.";

  return errors;
}

export function mapBackendResetPasswordFieldErrors(
  error: ApiError | null | undefined,
): ResetPasswordFieldErrors {
  if (!error?.details?.length) return {};

  return error.details.reduce<ResetPasswordFieldErrors>((acc, detail) => {
    if (detail.field === "newPassword") {
      acc.newPassword = (detail.message ?? detail.issue) as string;
    }
    if (detail.field === "confirmNewPassword") {
      acc.confirmNewPassword = (detail.message ?? detail.issue) as string;
    }
    return acc;
  }, {});
}
