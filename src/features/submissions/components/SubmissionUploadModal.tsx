import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  FileUp,
  RefreshCw,
  Trash2,
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
  existingSubmission?: ResearchSubmission | null;
  onClose: () => void;
  onCompleted: (submission: ResearchSubmission) => void;
};

type Phase =
  "idle" | "preparing" | "uploading" | "verifying" | "success" | "error";

export function SubmissionUploadModal({
  isOpen,
  projectId,
  requirement,
  existingSubmission = null,
  onClose,
  onCompleted,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadSession, setUploadSession] = useState<UploadSession | null>(
    null,
  );
  const [storageUploaded, setStorageUploaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isRevision = Boolean(existingSubmission);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setNote("");
      setPhase("idle");
      setProgress(0);
      setError(null);
      setUploadSession(null);
      setStorageUploaded(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
  const sessionExpired = uploadSession
    ? new Date(uploadSession.expiresAt).getTime() <= Date.now()
    : false;
  const expectedVersion =
    uploadSession?.versionNumber ?? (existingSubmission?.versionCount ?? 0) + 1;

  function selectFile(nextFile: File | null) {
    if (isBusy || uploadSession) return;
    setFile(nextFile);
    setError(null);
    setProgress(0);
    setPhase("idle");
  }

  function removeSelectedFile() {
    if (isBusy || uploadSession) return;
    setFile(null);
    setError(null);
    setProgress(0);
    setPhase("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function chooseAnotherFile() {
    if (isBusy || uploadSession) return;
    if (fileInputRef.current) fileInputRef.current.value = "";
    fileInputRef.current?.click();
  }

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
          : "The file was uploaded, but ResearchTrack could not finish recording the submission. Retry finalization without uploading the file again.",
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
      setUploadSession(null);
      setStorageUploaded(false);
      setProgress(0);
      setPhase("error");
      setError(
        "This upload attempt expired. Try again to start a fresh upload.",
      );
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
    } catch {
      setStorageUploaded(false);
      setPhase("error");
      setError("The file upload did not complete. You can retry this upload.");
    }
  }

  async function startUpload() {
    if (!requirement || !file || fileError) return;
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
          : "Unable to start this submission. Please try again.",
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
      ariaLabel={
        isRevision
          ? "Upload revised research document"
          : "Submit research document"
      }
    >
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isRevision
                ? "Upload revised version"
                : "Submit research document"}
            </h3>
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

        {isRevision ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <strong>Revision requested.</strong> This submission will be Version{" "}
            {expectedVersion}. Previous versions remain available in version
            history.
          </div>
        ) : null}

        <div className="mt-5 grid gap-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-3">
          <p>
            <span className="font-semibold text-slate-700">Accepted:</span>{" "}
            {requirement.allowedFileTypes.map((type) => `.${type}`).join(", ")}
          </p>
          <p>
            <span className="font-semibold text-slate-700">Maximum:</span>{" "}
            {formatBytes(requirement.maxFileSizeBytes)}
          </p>
          <p>
            <span className="font-semibold text-slate-700">Due:</span>{" "}
            {requirement.dueAt
              ? new Date(requirement.dueAt).toLocaleString()
              : "No deadline"}
          </p>
        </div>

        {phase === "success" ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-5 w-5" /> Version {expectedVersion}{" "}
              submitted
            </div>
            <p className="mt-2 text-sm leading-6">
              Your submission is now waiting for Supervisor review. Previous
              versions remain available in version history.
            </p>
            <Button className="mt-4" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              disabled={isBusy || Boolean(uploadSession)}
              accept={requirement.allowedFileTypes
                .map((type) => `.${type}`)
                .join(",")}
              onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
              className="sr-only"
            />

            {!file ? (
              <button
                type="button"
                disabled={isBusy || Boolean(uploadSession)}
                onClick={chooseAnotherFile}
                className="mt-5 flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileUp className="h-7 w-7 text-slate-500" />
                <span className="mt-3 text-sm font-semibold text-slate-900">
                  Choose a file
                </span>
                <span className="mt-1 text-xs text-slate-500">
                  Select one of the accepted file types shown above.
                </span>
              </button>
            ) : (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="rounded-xl bg-slate-100 p-2.5">
                      <FileText className="h-5 w-5 text-slate-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {file.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatBytes(file.size)} · {normalizedContentType(file)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={isBusy || Boolean(uploadSession)}
                      leftIcon={<FileUp className="h-4 w-4" />}
                      onClick={chooseAnotherFile}
                    >
                      Choose another
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isBusy || Boolean(uploadSession)}
                      leftIcon={<Trash2 className="h-4 w-4" />}
                      onClick={removeSelectedFile}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {fileError ? (
              <p className="mt-2 text-sm text-rose-600">{fileError}</p>
            ) : null}

            <label className="mt-4 block text-sm font-semibold text-slate-700">
              Submission note{" "}
              <span className="font-normal text-slate-400">(optional)</span>
              <textarea
                value={note}
                disabled={isBusy || Boolean(uploadSession)}
                maxLength={2000}
                onChange={(event) => setNote(event.target.value)}
                className="mt-2 min-h-24 w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                placeholder={
                  isRevision
                    ? "Summarize what changed in this revision"
                    : "Add context for this submission"
                }
              />
              <span className="mt-1 block text-right text-xs font-normal text-slate-400">
                {note.length}/2000
              </span>
            </label>

            {phase === "preparing" ||
            phase === "uploading" ||
            phase === "verifying" ? (
              <div className="mt-5" aria-live="polite">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>
                    {phase === "preparing"
                      ? "Preparing upload"
                      : phase === "uploading"
                        ? "Uploading file"
                        : "Finalizing submission"}
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
                      ? "Start a fresh upload"
                      : storageUploaded
                        ? "Retry finalization"
                        : "Retry upload"}
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
                  {phase === "preparing"
                    ? "Preparing…"
                    : isRevision
                      ? "Upload revision"
                      : "Submit file"}
                </Button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </ModalShell>
  );
}
