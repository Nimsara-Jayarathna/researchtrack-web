import { useEffect, useState } from "react";
import { X } from "lucide-react";
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

function toLocalInputValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
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
  const [dueAt, setDueAt] = useState("");
  const [allowedTypes, setAllowedTypes] = useState<string[]>(["pdf", "docx"]);
  const [maxSizeMb, setMaxSizeMb] = useState("10");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTitle(requirement?.title ?? "");
    setDescription(requirement?.description ?? "");
    setDueAt(toLocalInputValue(requirement?.dueAt ?? null));
    setAllowedTypes(requirement?.allowedFileTypes ?? ["pdf", "docx"]);
    setMaxSizeMb(
      requirement
        ? String(
            Math.max(1, Math.round(requirement.maxFileSizeBytes / 1024 / 1024)),
          )
        : "10",
    );
    setError(null);
  }, [isOpen, requirement]);

  if (!isOpen) return null;

  function toggleType(type: string) {
    setAllowedTypes((current) =>
      current.includes(type)
        ? current.filter((value) => value !== type)
        : [...current, type],
    );
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

    setSaving(true);
    setError(null);
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      dueAt: dueAt ? new Date(dueAt).toISOString() : null,
      allowedFileTypes: allowedTypes,
      maxFileSizeBytes: Math.round(maxMb * 1024 * 1024),
    };

    try {
      const saved = requirement
        ? await submissionApi.updateRequirement(
            projectId,
            requirement.id,
            payload,
          )
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
      ariaLabel={
        requirement
          ? "Edit submission requirement"
          : "Create submission requirement"
      }
    >
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {requirement
                ? "Edit submission requirement"
                : "Create submission requirement"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Define what students may submit. These rules are enforced again by
              the backend during upload finalization.
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
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Due date{" "}
              <span className="font-normal text-slate-400">(optional)</span>
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
                className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-4 font-normal outline-none focus:border-slate-400"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Maximum file size (MB)
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
          <fieldset>
            <legend className="text-sm font-semibold text-slate-700">
              Accepted file types
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {FILE_TYPES.map((type) => (
                <label
                  key={type}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={allowedTypes.includes(type)}
                    onChange={() => toggleType(type)}
                  />
                  .{type}
                </label>
              ))}
            </div>
          </fieldset>
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
          <Button
            variant="primary"
            disabled={saving}
            onClick={() => void save()}
          >
            {saving ? "Saving…" : "Save requirement"}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
