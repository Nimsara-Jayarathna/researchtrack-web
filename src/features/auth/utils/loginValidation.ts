import type { ApiError } from "@/types";

/**
 * Subset of login form fields that can carry a validation error message.
 */
export type LoginFieldErrors = {
  email?: string;
  password?: string;
};

/**
 * Pure client-side validation for the login form.
 *
 * Rules mirror the backend required/email constraints
 * so the user gets immediate feedback before the request is sent.
 *
 * @returns An error map — empty object means all fields are valid.
 */
export function validateLoginForm(
  email: string,
  password: string,
): LoginFieldErrors {
  const errors: LoginFieldErrors = {};

  if (!email) errors.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = "Enter a valid email.";

  if (!password) errors.password = "Password is required.";

  return errors;
}

/**
 * Maps a backend {@link ApiError} details array onto {@link LoginFieldErrors}.
 *
 * The shared API client normalizes .NET field errors into the existing UI detail shape.
 *
 * @returns A field-keyed error map, or an empty object when there are no details.
 */
export function mapBackendLoginFieldErrors(
  error: ApiError | null | undefined,
): LoginFieldErrors {
  if (!error?.details?.length) return {};
  return error.details.reduce<LoginFieldErrors>((acc, d) => {
    if (d.field === "email" || d.field === "password") {
      acc[d.field] = (d.message ?? d.issue) as string;
    }
    return acc;
  }, {});
}

/**
 * Returns the general (non-field) error message to show in the form banner,
 * or {@code null} when the error is field-level only (VALIDATION_ERROR).
 */
export function getLoginGeneralError(
  error: ApiError | null | undefined,
): string | null {
  return error && error.code !== "VALIDATION_ERROR" ? error.message : null;
}
