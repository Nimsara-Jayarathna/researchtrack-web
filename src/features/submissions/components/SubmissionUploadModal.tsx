import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  FileUp,
  RefreshCw,
  X,
} from "lucide-react";
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
import type {
  ResearchSubmission,
  SubmissionRequirement,
  UploadSession,
} from "../types";

type Props = {
  isOpen: boolean;
  projectId: string;
  requirement: SubmissionRequirement | null;
  onClose: () => void;
  onCompleted: (submission: ResearchSubmission) => void;
};

type Phase = "idle" | "preparing" | "uploading" | "verifying" | "success" | "error";

function isPdf(file: File) {
  return file.type.toLowerCase() === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

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
  const [uploadSession, setUploadSession] = useState<UploadSession | null>(null);
  const [storageUploaded, setStorageUploaded] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setNote("");
      setPhase("idle");
      setProgress(0);
      setError(null);
      setUploadSession(null);
      setStorageUploaded(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!file || !isPdf(file) || typeof URL.createObjectURL !== "function") {
      setPreviewUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setPreviewUrl(nextUrl);
    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [file]);

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
  const sessionExpired = uploadSession
    ? new Date(uploadSession.expiresAt).getTime() <= Date.now()
    : false;

  async function completeSession(sessionId: string) {
    try {
      setPhase("verifying");
      setError(null);
      const submission = await submissionApi.completeUploadSession(projectId, sessionId);
      setPhase("success");
      onCompleted(submission);
    } catch (caught) {
      setPhase("error");
      setError(
        isApiException(caught)
          ? caught.apiError.message
          : "The file reached storage, but ResearchTrack could not finalize it. Retry finalization without uploading the file again.",
      );
    }
  }

  async function releaseExpiredSession(session: UploadSession) {
    try {
      const submission = await submissionApi.completeUploadSession(
        projectId,
        session.uploadSessionId,
      );
      setStorageUploaded(true);
      setPhase("success");
      onCompleted(submission);
    } catch {
      // The backend marks an expired session inactive while rejecting completion.
      // Clearing the local session then allows a fresh upload session to be created.
      setUploadSession(null);
      setStorageUploaded(false);
      setProgress(0);
      setPhase("error");
      setError("The secure upload URL expired. Submit the selected file again to create a new upload session.");
    }
  }

  async function uploadBytes(session: UploadSession) {
    if (!file) return;

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      await releaseExpiredSession(session);
      return;
    }

    try {
      setPhase("uploading");
      setError(null);
      setProgress(0);
      await uploadFileDirectly(
        session.uploadUrl,
        file,
        session.requiredHeaders,
        setProgress,
      );
      setStorageUploaded(true);
      await completeSession(session.uploadSessionId);
    } catch (caught) {
      setStorageUploaded(false);
      setPhase("error");
      setError(
        caught instanceof Error
          ? `${caught.message} The same secure upload can be retried while its URL is still valid.`
          : "Unable to upload this file to S3. Retry the upload while the secure URL remains valid.",
      );
    }
  }

  async function startUpload() {
    if (!file || fileError) return;

    try {
      setPhase("preparing");
      setError(null);
      setProgress(0);
      setStorageUploaded(false);
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
      setUploadSession(session);
      await uploadBytes(session);
    } catch (caught) {
      setPhase("error");
      setError(
        isApiException(caught)
          ? caught.apiError.message
          : caught instanceof Error
            ? caught.message
            : "Unable to prepare this submission.",
      );
    }
  }

  async function retryCurrentStep() {
    if (!uploadSession) return;
    if (sessionExpired) {
      await releaseExpiredSession(uploadSession);
      return;
    }
    if (storageUploaded) {
      await completeSession(uploadSession.uploadSessionId);
      return;
    }
    await uploadBytes(uploadSession);
  }

  return (
    <ModalShell
      isOpen={isOpen}
      containerClassName="fixed inset-0 z-50 flex items-center justify-center p-4"
      backdropClassName="absolute inset-0 bg-slate-950/45"
      dialogClassName="relative z-10 w-full max-w-2xl"
      onBackdropClick={isBusy || Boolean(uploadSession) ? undefined : onClose}
      lockBodyScroll
      ariaLabel="Submit research document"
    >
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Submit research document</h3>
            <p className="mt-1 text-sm text-slate-500">{requirement.title}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            disabled={isBusy || (Boolean(uploadSession) && phase !== "success")}
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <p>
            Accepted: {requirement.allowedFileTypes.map((type) => `.${type}`).join(", ")}
          </p>
          <p className="mt-1">Maximum size: {formatBytes(requirement.maxFileSizeBytes)}</p>
          <p className="mt-1">
            Due: {requirement.dueAt ? new Date(requirement.dueAt).toLocaleString() : "No due date"}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            The browser uploads directly to private S3 with a short-lived object-scoped URL. ResearchTrack records Version 1 only after the backend verifies the stored object.
          </p>
        </div>

        {phase === "success" ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-5 w-5" /> Submission recorded
            </div>
            <p className="mt-2 text-sm leading-6">
              Version 1 is now pending review. This recorded version cannot be deleted or replaced by the Student in the current story.
            </p>
            <Button className="mt-4" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <>
            <label className="mt-5 block text-sm font-semibold text-slate-700">
              File
              <input
                type="file"
                disabled={isBusy || Boolean(uploadSession)}
                accept={requirement.allowedFileTypes.map((type) => `.${type}`).join(",")}
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  setError(null);
                  setProgress(0);
                }}
                className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:font-semibold"
              />
            </label>

            {file ? (
              <div className="mt-3 rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{file.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatBytes(file.size)} · {normalizedContentType(file)}
                    </p>
                  </div>
                </div>
                {previewUrl ? (
                  <iframe
                    title="Selected PDF preview"
                    src={previewUrl}
                    className="mt-4 h-64 w-full rounded-xl border border-slate-200 bg-white"
                  />
                ) : null}
              </div>
            ) : null}

            {fileError ? <p className="mt-2 text-sm text-rose-600">{fileError}</p> : null}

            <label className="mt-4 block text-sm font-semibold text-slate-700">
              Submission note <span className="font-normal text-slate-400">(optional)</span>
              <textarea
                value={note}
                disabled={isBusy || Boolean(uploadSession)}
                maxLength={2000}
                onChange={(event) => setNote(event.target.value)}
                className="mt-2 min-h-24 w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                placeholder="Add context for this submission"
              />
              <span className="mt-1 block text-right text-xs font-normal text-slate-400">
                {note.length}/2000
              </span>
            </label>

            {phase === "preparing" || phase === "uploading" || phase === "verifying" ? (
              <div className="mt-5" aria-live="polite">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>
                    {phase === "preparing"
                      ? "Creating secure upload session"
                      : phase === "uploading"
                        ? "Uploading directly to S3"
                        : "Verifying and recording submission"}
                  </span>
                  <span>{phase === "uploading" ? `${progress}%` : "…"}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-slate-900 transition-all"
                    style={{
                      width: `${phase === "preparing" ? 10 : phase === "verifying" ? 100 : progress}%`,
                    }}
                  />
                </div>
              </div>
            ) : null}

            {error ? (
              <div
                role="alert"
                className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
                {uploadSession ? (
                  <Button
                    className="mt-3"
                    variant="secondary"
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                    onClick={() => void retryCurrentStep()}
                  >
                    {sessionExpired
                      ? "Reset expired upload"
                      : storageUploaded
                        ? "Retry finalization"
                        : "Retry S3 upload"}
                  </Button>
                ) : null}
              </div>
            ) : null}

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="secondary"
                disabled={isBusy || Boolean(uploadSession)}
                onClick={onClose}
              >
                Cancel
              </Button>
              {!uploadSession ? (
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

            {uploadSession && phase !== "success" ? (
              <p className="mt-3 text-center text-xs leading-5 text-slate-400">
                Keep this window open while the upload session is active. If the direct S3 transfer fails, use Retry S3 upload instead of creating another submission.
              </p>
            ) : null}
          </>
        )}
      </div>
    </ModalShell>
  );
}
