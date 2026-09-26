import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/cn";
import {
  FIELD_LIMITS,
  SEMESTER_OPTIONS,
  buildBatchYearOptions,
} from "../../createProject.shared";
import type { DraftState } from "../../createProject.shared";

type BasicsStepSectionProps = {
  draft: DraftState;
  step1Valid: boolean;
  isSubmitting: boolean;
  onUpdateDraft: <F extends keyof DraftState>(
    field: F,
    value: DraftState[F],
  ) => void;
  onNext: () => void;
};

function CharLimit({ current, max }: { current: number; max: number }) {
  const atLimit = current >= max;
  return (
    <span
      className={cn(
        "text-xs",
        atLimit ? "font-medium text-amber-700" : "text-muted-foreground",
      )}
      aria-live="polite"
    >
      {current}/{max} characters
    </span>
  );
}

function RequiredLabel({ children }: { children: string }) {
  return (
    <>
      {children}
      <span className="ml-1 text-rose-600" aria-hidden="true">
        *
      </span>
      <span className="sr-only"> (required)</span>
    </>
  );
}

export function BasicsStepSection({
  draft,
  step1Valid,
  isSubmitting,
  onUpdateDraft,
  onNext,
}: BasicsStepSectionProps) {
  const batchYearOptions = buildBatchYearOptions();

  return (
    <section className="mx-auto max-w-6xl space-y-6 rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-7">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Project basics
        </h2>
        <p className="mt-1 text-sm leading-7 text-muted-foreground">
          Capture the core project details. Fields marked with
          <span className="mx-1 font-semibold text-rose-600" aria-hidden="true">
            *
          </span>
          are required.
        </p>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-foreground">
          <RequiredLabel>Project title</RequiredLabel>
        </span>
        <input
          required
          value={draft.title}
          onChange={(e) => onUpdateDraft("title", e.target.value)}
          maxLength={FIELD_LIMITS.title}
          placeholder="e.g. Smart Attendance Tracker"
          className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
          disabled={isSubmitting}
        />
      </label>

      <label className="block">
        <span className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-foreground">
          <span><RequiredLabel>Summary</RequiredLabel></span>
          <CharLimit
            current={draft.summary.length}
            max={FIELD_LIMITS.summary}
          />
        </span>
        <textarea
          required
          value={draft.summary}
          onChange={(e) => onUpdateDraft("summary", e.target.value)}
          maxLength={FIELD_LIMITS.summary}
          placeholder="Describe the project scope, purpose, and expected outcome."
          rows={4}
          className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
          disabled={isSubmitting}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-foreground">
            <RequiredLabel>Batch</RequiredLabel>
          </span>
          <Select
            required
            value={draft.batch}
            onChange={(e) => onUpdateDraft("batch", e.target.value)}
            disabled={isSubmitting}
            aria-label="Batch year"
            className={cn(
              "w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300 focus:ring-2 focus:ring-amber-100 disabled:cursor-not-allowed disabled:opacity-60",
              !draft.batch && "text-muted-foreground",
            )}
          >
            <option value="" disabled>
              Select batch year
            </option>
            {batchYearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-foreground">
            <RequiredLabel>Semester</RequiredLabel>
          </span>
          <Select
            required
            value={draft.semester}
            onChange={(e) => onUpdateDraft("semester", e.target.value)}
            disabled={isSubmitting}
            aria-label="Semester"
            className={cn(
              "w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300 focus:ring-2 focus:ring-amber-100 disabled:cursor-not-allowed disabled:opacity-60",
              !draft.semester && "text-muted-foreground",
            )}
          >
            <option value="" disabled>
              Select semester
            </option>
            {SEMESTER_OPTIONS.map((semester) => (
              <option key={semester} value={semester}>
                {semester}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="primary"
          size="md"
          disabled={!step1Valid}
          onClick={onNext}
        >
          Next: Assign students →
        </Button>
      </div>
    </section>
  );
}
