import PasswordStrengthBar from "react-password-strength-bar";
import { Check, Circle } from "lucide-react";
import { useMemo, useState } from "react";
import type { PasswordPolicyConfig } from "../types";
import {
  getPasswordChecks,
  isPasswordPolicyPassed,
  resolvePasswordPolicy,
} from "../utils/passwordRules";

type PasswordRequirementsPanelProps = {
  password: string;
  compact?: boolean;
  isNewPasswordFocused?: boolean;
  policy?: PasswordPolicyConfig | null;
};

export function PasswordRequirementsPanel({
  password,
  compact = false,
  isNewPasswordFocused = false,
  policy,
}: PasswordRequirementsPanelProps) {
  const [strengthScore, setStrengthScore] = useState(0);
  const resolvedPolicy = resolvePasswordPolicy(policy);
  const remainingCharacters = Math.max(
    0,
    resolvedPolicy.minimumLength - (password?.length ?? 0),
  );
  const spacingClass = compact ? "space-y-2" : "space-y-3";
  const passwordChecks = getPasswordChecks(password, resolvedPolicy);
  const isPolicyPassed = isPasswordPolicyPassed(passwordChecks);

  const requirements = [
    {
      key: "minLength",
      enabled: true,
      passed: passwordChecks.minLength,
      label: `At least ${resolvedPolicy.minimumLength} characters`,
    },
    {
      key: "maxLength",
      enabled: true,
      passed: passwordChecks.maxLength,
      label: `No more than ${resolvedPolicy.maximumLength} characters`,
    },
    {
      key: "uppercase",
      enabled: resolvedPolicy.requireUppercase,
      passed: passwordChecks.uppercase,
      label: "One uppercase letter",
    },
    {
      key: "lowercase",
      enabled: resolvedPolicy.requireLowercase,
      passed: passwordChecks.lowercase,
      label: "One lowercase letter",
    },
    {
      key: "digit",
      enabled: resolvedPolicy.requireDigit,
      passed: passwordChecks.digit,
      label: "One number",
    },
    {
      key: "specialCharacter",
      enabled: resolvedPolicy.requireSpecialCharacter,
      passed: passwordChecks.specialCharacter,
      label: "One special character",
    },
  ].filter((requirement) => requirement.enabled);

  const mode = useMemo<"hidden" | "full" | "compactSuccess">(() => {
    if (!isNewPasswordFocused && password.length === 0) return "hidden";
    if (isNewPasswordFocused) return "full";
    if (isPolicyPassed) return "compactSuccess";
    return "full";
  }, [isNewPasswordFocused, isPolicyPassed, password.length]);

  const revealClass =
    mode === "hidden"
      ? "pointer-events-none max-h-0 -translate-y-1 opacity-0"
      : mode === "compactSuccess"
        ? "max-h-14 translate-y-0 opacity-100"
        : "max-h-96 translate-y-0 opacity-100";

  return (
    <div
      aria-hidden={mode === "hidden"}
      className={`overflow-hidden transition-all duration-200 ease-out ${revealClass}`}
    >
      {mode === "compactSuccess" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          ✓ Password requirements met
        </div>
      ) : (
        <div
          className={`rounded-2xl border border-slate-200 bg-slate-50/70 p-3 ${spacingClass}`}
        >
          <div>
            <p className="text-sm font-semibold text-slate-700">
              Password requirements
            </p>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {requirements.map((requirement) => (
                <div
                  key={requirement.key}
                  className={`flex items-center gap-2 text-xs font-medium ${
                    requirement.passed ? "text-emerald-700" : "text-slate-500"
                  }`}
                >
                  {requirement.passed ? (
                    <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  ) : (
                    <Circle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  )}
                  <span>{requirement.label}</span>
                </div>
              ))}
            </div>
          </div>

          {password.length > 0 && remainingCharacters > 0 ? (
            <p className="text-xs text-rose-600">
              Needs {remainingCharacters} more characters...
            </p>
          ) : null}

          <PasswordStrengthBar
            password={password}
            minLength={resolvedPolicy.minimumLength}
            scoreWords={["Very Weak", "Weak", "Okay", "Good", "Strong!"]}
            shortScoreWord="Too short"
            onChangeScore={(score) => setStrengthScore(score)}
          />
          <span className="sr-only" aria-live="polite">
            Password strength score {strengthScore} of 4
          </span>
        </div>
      )}
    </div>
  );
}
