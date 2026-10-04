import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ModalShell } from "@/components/ui/ModalShell";
import { isApiException } from "@/services/apiClient";
import { submissionApi } from "../api/submissionApi";
import type { SubmissionRequirement } from "../types";

const FILE_TYPES = ["pdf", "docx", "pptx", "zip"] as const;

type Props = {
  isOpen: boolean;
  projectId: string;
  requirement: SubmissionRequirement | null;
  onClose: () => void;
  onSaved: (requirement: SubmissionRequirement) => void;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function localDateValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function localTimeValue(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function splitDueAt(value: string | null) {
  if (!value) return { date: "", time: "" };
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { date: "", time: "" };
  return { date: localDateValue(parsed), time: localTimeValue(parsed) };
}

function defaultFutureDeadline() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return { date: localDateValue(date), time: localTimeValue(date) };
}

function combineDeadline(dateValue: string, timeValue: string) {
  if (!dateValue || !timeValue) return null;
  const date = new Date(`${dateValue}T${timeValue}:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function RequirementEditorModal({
  isOpen,
  projectId,
  requirement,
  onClose,
  onSaved,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadlineEnabled, setDeadlineEnabled] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [allowedTypes, setAllowedTypes] = useState<string[]>(["pdf", "docx"]);
  const [maxSizeMb, setMaxSizeMb] = useState("10");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const due = splitDueAt(requirement?.dueAt ?? null);
    setTitle(requirement?.title ?? "");
    setDescription(requirement?.description ?? "");
    setDeadlineEnabled(Boolean(requirement?.dueAt));
    setDueDate(due.date);
    setDueTime(due.time);
    setAllowedTypes(requirement?.allowedFileTypes ?? ["pdf", "docx"]);
    setMaxSizeMb(
      requirement
        ? String(Math.max(1, Math.round(requirement.maxFileSizeBytes / 1024 / 1024)))
        : "10",
    );
    setError(null);
  }, [isOpen, requirement]);

  const today = localDateValue(new Date());
  const minimumTime = useMemo(() => {
    if (dueDate !== today) return undefined;
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1, 0, 0);
    return localTimeValue(now);
  }, [dueDate, today]);

  if (!isOpen) return null;

  function toggleType(type: string) {
    setAllowedTypes((current) =>
      current.includes(type)
        ? current.filter((value) => value !== type)
        : [...current, type],
    );
  }

  function toggleDeadline(enabled: boolean) {
    setDeadlineEnabled(enabled);
    setError(null);
    if (enabled && (!dueDate || !dueTime)) {
      const next = defaultFutureDeadline();
      setDueDate(next.date);
      setDueTime(next.time);
    }
  }

  async function save() {
    const maxMb = Number(maxSizeMb);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (allowedTypes.length === 0) {
      setError("Choose at least one accepted file type.");
      return;
    }
    if (!Number.isFinite(maxMb) || maxMb <= 0) {
      setError("Maximum file size must be greater than zero.");
      return;
    }

    let dueAt: string | null = null;
    if (deadlineEnabled) {
      const deadline = combineDeadline(dueDate, dueTime);
      if (!deadline) {
        setError("Choose both a due date and a due time.");
        return;
      }

      const originalDeadline = splitDueAt(requirement?.dueAt ?? null);
      const deadlineChanged =
        originalDeadline.date !== dueDate || originalDeadline.time !== dueTime;
      if (deadlineChanged && deadline.getTime() <= Date.now()) {
        setError("Due date and time must be in the future.");
        return;
      }
      dueAt = deadline.toISOString();
    }

    setSaving(true);
    setError(null);
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      dueAt,
      allowedFileTypes: allowedTypes,
      maxFileSizeBytes: Math.round(maxMb * 1024 * 1024),
    };

    try {
      const saved = requirement
        ? await submissionApi.updateRequirement(projectId, requirement.id, payload)
        : await submissionApi.createRequirement(projectId, payload);
      onSaved(saved);
      onClose();
    } catch (caught) {
      setError(
        isApiException(caught)
          ? caught.apiError.message
          : "Unable to save this requirement.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      isOpen={isOpen}
      containerClassName="fixed inset-0 z-50 flex items-center justify-center p-4"
      backdropClassName="absolute inset-0 bg-slate-950/45"
      dialogClassName="relative z-10"
      onBackdropClick={saving ? undefined : onClose}
      lockBodyScroll
      ariaLabel={requirement ? "Edit submission requirement" : "Create submission requirement"}
    >
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {requirement ? "Edit submission requirement" : "Create submission requirement"}
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Define the document rules students must satisfy before a file can be recorded.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            disabled={saving}
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          <label className="text-sm font-semibold text-slate-700">
            Title
            <input
              value={title}
              maxLength={200}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-4 font-normal outline-none focus:border-slate-400"
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Instructions
            <textarea
              value={description}
              maxLength={4000}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-slate-400"
            />
          </label>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">Submission deadline</p>
                <p className="mt-1 text-xs text-slate-500">
                  Only future dates and times can be selected for a new deadline.
                </p>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600">
                <input
                  type="checkbox"
                  checked={!deadlineEnabled}
                  onChange={(event) => toggleDeadline(!event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                No deadline
              </label>
            </div>

            {deadlineEnabled ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Due date
                  <div className="relative mt-2">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      value={dueDate}
                      min={today}
                      onChange={(event) => {
                        setDueDate(event.target.value);
                        setError(null);
                      }}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-normal text-slate-800 outline-none focus:border-slate-400"
                    />
                  </div>
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Due time
                  <div className="relative mt-2">
                    <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="time"
                      value={dueTime}
                      min={minimumTime}
                      onChange={(event) => {
                        setDueTime(event.target.value);
                        setError(null);
                      }}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-normal text-slate-800 outline-none focus:border-slate-400"
                    />
                  </div>
                </label>
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
            <fieldset>
              <legend className="text-sm font-semibold text-slate-700">Accepted file types</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {FILE_TYPES.map((type) => {
                  const selected = allowedTypes.includes(type);
                  return (
                    <label
                      key={type}
                      className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${selected ? "border-slate-400 bg-slate-100 text-slate-900" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleType(type)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      .{type}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <label className="text-sm font-semibold text-slate-700">
              Maximum size (MB)
              <input
                type="number"
                min="1"
                step="1"
                value={maxSizeMb}
                onChange={(event) => setMaxSizeMb(event.target.value)}
                className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-4 font-normal outline-none focus:border-slate-400"
              />
            </label>
          </div>

          {requirement?.submissionSummary ? (
            <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-xs leading-5 text-sky-800">
              This requirement already has submission history. File type and size changes apply only to future uploads; recorded versions and formal reviews remain unchanged.
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" disabled={saving} onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={saving} onClick={() => void save()}>
            {saving ? "Saving…" : requirement ? "Save changes" : "Create requirement"}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
