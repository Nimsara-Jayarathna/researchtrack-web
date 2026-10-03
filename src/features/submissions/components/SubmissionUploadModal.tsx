import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileUp, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ModalShell } from "@/components/ui/ModalShell";
import { isApiException } from "@/services/apiClient";
import { submissionApi } from "../api/submissionApi";
import {
  formatBytes,
  normalizedContentType,
  validateSubmissionFile,
} from "../lib/submissionFiles";
import { uploadFileDirectly } from "../lib/directS3Upload";
import type { ResearchSubmission, SubmissionRequirement } from "../types";

type Props = {
  isOpen: boolean;
  projectId: string;
  requirement: SubmissionRequirement | null;
  onClose: () => void;
  onCompleted: (submission: ResearchSubmission) => void;
};

type Phase = "idle" | "preparing" | "uploading" | "verifying" | "success" | "error";

export function SubmissionUploadModal({
  isOpen,
  projectId,
  requirement,
  onClose,
  onCompleted,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadSessionId, setUploadSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setNote("");
      setPhase("idle");
      setProgress(0);
      setError(null);
      setUploadSessionId(null);
    }
  }, [isOpen]);

  const fileError = useMemo(() => {
    if (!file || !requirement) return null;
    return validateSubmissionFile(
      file,
      requirement.allowedFileTypes,
      requirement.maxFileSizeBytes,
    );
  }, [file, requirement]);

  if (!requirement) return null;

  const isBusy = ["preparing", "uploading", "verifying"].includes(phase);

  async function completeSession(sessionId: string) {
    try {
      setPhase("verifying");
      setError(null);
      const submission = await submissionApi.completeUploadSession(
        projectId,
        sessionId,
      );
      setPhase("success");
      onCompleted(submission);
    } catch (caught) {
      setPhase("error");
      setError(
        isApiException(caught)
          ? caught.apiError.message
          : "The file reached storage, but ResearchTrack could not finalize it. You can retry verification without uploading the file again.",
      );
    }
  }

  async function startUpload() {
    if (!file || fileError) return;
    try {
      setPhase("preparing");
      setError(null);
      setProgress(0);
      const session = await submissionApi.createUploadSession(
        projectId,
        requirement.id,
        {
          fileName: file.name,
          contentType: normalizedContentType(file),
          fileSizeBytes: file.size,
          submissionNote: note.trim() || null,
        },
      );
      setUploadSessionId(session.uploadSessionId);
      setPhase("uploading");
      await uploadFileDirectly(
        session.uploadUrl,
        file,
        session.requiredHeaders,
        setProgress,
      );
      await completeSession(session.uploadSessionId);
    } catch (caught) {
      setPhase("error");
      setError(
        isApiException(caught)
          ? caught.apiError.message
          : caught instanceof Error
            ? caught.message
            : "Unable to upload this file.",
      );
    }
  }

  return (
    <ModalShell
      isOpen={isOpen}
      containerClassName="fixed inset-0 z-50 flex items-center justify-center p-4"
      backdropClassName="absolute inset-0 bg-slate-950/45"
      dialogClassName="relative z-10"
      onBackdropClick={isBusy ? undefined : onClose}
      lockBodyScroll
      ariaLabel="Submit research document"
    >
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Submit research document</h3>
            <p className="mt-1 text-sm text-slate-500">{requirement.title}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            disabled={isBusy}
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <p>
            Accepted: {requirement.allowedFileTypes.map((type) => `.${type}`).join(", ")}
          </p>
          <p className="mt-1">Maximum size: {formatBytes(requirement.maxFileSizeBytes)}</p>
          <p className="mt-1 text-xs text-slate-500">
            The browser uploads directly to private S3 using a short-lived URL. ResearchTrack records the submission only after the backend verifies the stored object.
          </p>
        </div>

        {phase === "success" ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-5 w-5" /> Submission recorded
            </div>
            <p className="mt-2 text-sm">Version 1 is now pending review.</p>
            <Button className="mt-4" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <>
            <label className="mt-5 block text-sm font-semibold text-slate-700">
              File
              <input
                type="file"
                disabled={isBusy || Boolean(uploadSessionId)}
                accept={requirement.allowedFileTypes.map((type) => `.${type}`).join(",")}
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:font-semibold"
              />
            </label>
            {file ? (
              <p className="mt-2 text-xs text-slate-500">{file.name} · {formatBytes(file.size)}</p>
            ) : null}
            {fileError ? <p className="mt-2 text-sm text-rose-600">{fileError}</p> : null}

            <label className="mt-4 block text-sm font-semibold text-slate-700">
              Submission note <span className="font-normal text-slate-400">(optional)</span>
              <textarea
                value={note}
                disabled={isBusy || Boolean(uploadSessionId)}
                maxLength={1000}
                onChange={(event) => setNote(event.target.value)}
                className="mt-2 min-h-24 w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                placeholder="Add context for this submission"
              />
            </label>

            {phase === "uploading" || phase === "verifying" ? (
              <div className="mt-5">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>{phase === "uploading" ? "Uploading to S3" : "Verifying and recording"}</span>
                  <span>{phase === "uploading" ? `${progress}%` : "…"}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full bg-slate-900 transition-all" style={{ width: `${phase === "verifying" ? 100 : progress}%` }} />
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <p>{error}</p>
                {uploadSessionId ? (
                  <Button
                    className="mt-3"
                    variant="secondary"
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                    onClick={() => void completeSession(uploadSessionId)}
                  >
                    Retry finalization
                  </Button>
                ) : null}
              </div>
            ) : null}

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" disabled={isBusy} onClick={onClose}>Cancel</Button>
              {!uploadSessionId ? (
                <Button
                  variant="primary"
                  disabled={!file || Boolean(fileError) || isBusy}
                  leftIcon={<FileUp className="h-4 w-4" />}
                  onClick={() => void startUpload()}
                >
                  {phase === "preparing" ? "Preparing…" : "Submit file"}
                </Button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </ModalShell>
  );
}
