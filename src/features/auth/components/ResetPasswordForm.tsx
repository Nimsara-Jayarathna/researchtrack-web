import { Button } from "@/components/ui/Button";
import { useMemo, useState } from "react";
import { PasswordRequirementsPanel } from "./PasswordRequirementsPanel";
import { PasswordField } from "./PasswordField";
import { resolvePasswordPolicy } from "../utils/passwordRules";
import type { PasswordPolicyConfig } from "../types";
import {
  type ResetPasswordFieldErrors,
  validateResetPasswordForm,
} from "../utils/resetPasswordValidation";

export type ResetPasswordFormProps = {
  onSubmit: (newPassword: string) => Promise<void>;
  isLoading: boolean;
  onClearError: () => void;
  passwordPolicy?: PasswordPolicyConfig | null;
};

export function ResetPasswordForm({
  onSubmit,
  isLoading,
  onClearError,
  passwordPolicy,
}: ResetPasswordFormProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isNewPasswordFocused, setIsNewPasswordFocused] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ResetPasswordFieldErrors>({});
  const resolvedPasswordPolicy = resolvePasswordPolicy(passwordPolicy);
  const isConfirmPasswordFilled = confirmNewPassword.trim().length > 0;
  const isConfirmMatched =
    isConfirmPasswordFilled && newPassword === confirmNewPassword;
  const isMismatch = isConfirmPasswordFilled && !isConfirmMatched;

  const isValid = useMemo(
    () =>
      Object.keys(
        validateResetPasswordForm(
          { newPassword, confirmNewPassword },
          resolvedPasswordPolicy,
        ),
      ).length === 0,
    [newPassword, confirmNewPassword, resolvedPasswordPolicy],
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onClearError();

    const errors = validateResetPasswordForm(
      { newPassword, confirmNewPassword },
      resolvedPasswordPolicy,
    );
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    await onSubmit(newPassword);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      <PasswordField
        id="reset-password-new"
        label="New Password"
        autoComplete="new-password"
        placeholder="Enter your new password"
        value={newPassword}
        onChange={setNewPassword}
        maxLength={resolvedPasswordPolicy.maximumLength}
        isVisible={showNewPassword}
        onToggleVisibility={() => setShowNewPassword((value) => !value)}
        onFocus={() => setIsNewPasswordFocused(true)}
        onBlur={() => setIsNewPasswordFocused(false)}
      />
      <PasswordRequirementsPanel
        password={newPassword}
        isNewPasswordFocused={isNewPasswordFocused}
        policy={resolvedPasswordPolicy}
      />
      {fieldErrors.newPassword && (
        <p className="text-xs text-rose-600">{fieldErrors.newPassword}</p>
      )}

      <PasswordField
        id="reset-password-confirm"
        label="Confirm New Password"
        autoComplete="new-password"
        placeholder="Re-enter new password"
        value={confirmNewPassword}
        onChange={setConfirmNewPassword}
        maxLength={resolvedPasswordPolicy.maximumLength}
        isVisible={showConfirmPassword}
        onToggleVisibility={() => setShowConfirmPassword((value) => !value)}
        showMismatch={isConfirmPasswordFilled}
        mismatch={isMismatch}
      />
      {fieldErrors.confirmNewPassword && (
        <p className="text-xs text-rose-600">
          {fieldErrors.confirmNewPassword}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        disabled={isLoading || !isValid}
      >
        Update password
      </Button>
    </form>
  );
}
