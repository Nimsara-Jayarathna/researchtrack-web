import { isValidEmailFormat } from "./emailRestrictionValidation";

export type ForgotPasswordFieldErrors = {
  email?: string;
};

export function validateForgotPasswordForm(
  email: string,
): ForgotPasswordFieldErrors {
  const errors: ForgotPasswordFieldErrors = {};

  if (!email) errors.email = "Email is required.";
  else if (!isValidEmailFormat(email)) errors.email = "Enter a valid email.";

  return errors;
}

export function getForgotPasswordValidationState(email: string) {
  const hasAt = email.includes("@");
  const hasInvalidFormat = hasAt && !isValidEmailFormat(email);

  return {
    hasAt,
    hasInvalidFormat,
  };
}
