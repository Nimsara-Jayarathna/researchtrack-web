import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  FileClock,
  RefreshCw,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ModalShell } from "@/components/ui/ModalShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { isApiException } from "@/services/apiClient";
import { submissionApi } from "../api/submissionApi";
import { formatBytes } from "../lib/submissionFiles";
import type {
  ResearchSubmission,
  ReviewDecision,
  SubmissionParticipantRole,
  SubmissionStatus,
  SubmissionVersion,
} from "../types";
import { SubmissionPreviewButton } from "./SubmissionPreviewButton";
import { SubmissionPreviewModal } from "./SubmissionPreviewModal";

type Props = {
  isOpen: boolean;
  projectId: string;
  submission: ResearchSubmission | null;
  viewerRole: SubmissionParticipantRole;
  onClose: () => void;
  onUpdated: (submission: ResearchSubmission) => void;
};


function authorityRoleLabel(value: string | null | undefined) {
  if (value === "PROJECT_LEADER") return "Project Leader";
  if (value === "ASSIGNED_STUDENT") return "Assigned submitter";
  return null;
}

function readable(value: string) {
  return value.replace(/_/g, " ");
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function statusTone(status: SubmissionStatus) {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "danger";
  return "warning";
}

function decisionTone(decision: ReviewDecision) {
  if (decision === "APPROVED") return "success";
  if (decision === "REJECTED") return "danger";
  return "warning";
}

function VersionActions({
  version,
  downloadBusy,
  onPreview,
  onDownload,
}: {
  version: SubmissionVersion;
  downloadBusy: boolean;
  onPreview: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      <SubmissionPreviewButton
        version={version}
        busy={downloadBusy}
        onPreview={onPreview}
      />
      <Button
        size="sm"
        variant="secondary"
        disabled={downloadBusy}
        leftIcon={<Download className="h-4 w-4" />}
        onClick={onDownload}
      >
        {downloadBusy ? "Preparing…" : "Download"}
      </Button>
    </div>
  );
}

export function SubmissionDetailModal({
  isOpen,
  projectId,
  submission,
  viewerRole,
  onClose,
  onUpdated,
}: Props) {
  const [detail, setDetail] = useState<ResearchSubmission | null>(submission);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadVersionId, setDownloadVersionId] = useState<string | null>(
    null,
  );
  const [previewVersion, setPreviewVersion] =
    useState<SubmissionVersion | null>(null);
  const [decision, setDecision] = useState<ReviewDecision | null>(null);
  const [feedback, setFeedback] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);

  const load = useCallback(async () => {
    if (!submission) return;
    setLoading(true);
    try {
      const nextDetail = await submissionApi.getSubmission(
        projectId,
        submission.id,
      );
      setDetail(nextDetail);
      setError(null);
    } catch (caught) {
      setError(
        isApiException(caught)
          ? caught.apiError.message
          : "Unable to load this submission.",
      );
    } finally {
      setLoading(false);
    }
  }, [projectId, submission]);

  useEffect(() => {
    setDetail(submission);
    setDecision(null);
    setFeedback("");
    setError(null);
    setPreviewVersion(null);
    if (isOpen && submission) void load();
  }, [isOpen, load, submission]);

  const current = useMemo(
    () =>
      detail?.versions.find(
        (version) => version.id === detail.currentVersionId,
      ) ??
      detail?.versions.find((version) => version.isCurrent) ??
      null,
    [detail],
  );

  const orderedVersions = useMemo(
    () =>
      [...(detail?.versions ?? [])].sort(
        (a, b) => b.versionNumber - a.versionNumber,
      ),
    [detail?.versions],
  );

  async function downloadVersion(version: SubmissionVersion) {
    if (!detail) return;
    setDownloadVersionId(version.id);
    setError(null);
    try {
      const grant = await submissionApi.getDownloadUrl(
        projectId,
        detail.id,
        version.id,
        "attachment",
      );
      const anchor = document.createElement("a");
      anchor.href = grant.url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.click();
    } catch {
      setError("Unable to download this file. Please try again.");
    } finally {
      setDownloadVersionId(null);
    }
  }

  async function submitReview() {
    if (!detail || !current || !decision) return;
    if (
      (decision === "CHANGES_REQUESTED" || decision === "REJECTED") &&
      !feedback.trim()
    ) {
      setError("Feedback is required when requesting changes or rejecting.");
      return;
    }

    setReviewBusy(true);
    setError(null);
    try {
      const updated = await submissionApi.reviewSubmission(
        projectId,
        detail.id,
        {
          versionId: current.id,
          decision,
          feedback: feedback.trim() || null,
        },
      );
      setDetail(updated);
      setDecision(null);
      setFeedback("");
      onUpdated(updated);
    } catch (caught) {
      setError(
        isApiException(caught)
          ? caught.apiError.message
          : "Unable to record the formal review.",
      );
      if (isApiException(caught) && caught.apiError.status === 409) {
        await load();
      }
    } finally {
      setReviewBusy(false);
    }
  }

  const canReview =
    viewerRole === "SUPERVISOR" &&
    detail?.status === "PENDING_REVIEW" &&
    Boolean(current);

  return (
    <>
      <ModalShell
        isOpen={isOpen}
        containerClassName="fixed inset-0 z-50 flex items-center justify-center p-4"
        backdropClassName="absolute inset-0 bg-slate-950/45"
        dialogClassName="relative z-10 w-full max-w-5xl"
        onBackdropClick={reviewBusy ? undefined : onClose}
        lockBodyScroll
        ariaLabel="Submission details"
      >
        <div className="max-h-[94vh] w-full overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-xl font-bold text-slate-900">
                  {detail?.requirement.title ??
                    submission?.requirement.title ??
                    "Submission"}
                </h2>
                {detail ? (
                  <StatusBadge tone={statusTone(detail.status)}>
                    {readable(detail.status)}
                  </StatusBadge>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Review the current submission and compare previous versions.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={loading}
                leftIcon={
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                }
                onClick={() => void load()}
              >
                Refresh
              </Button>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {error ? (
            <div
              role="alert"
              className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
              {error}
            </div>
          ) : null}

          {loading && !detail ? (
            <div className="mt-6 h-64 animate-pulse rounded-2xl bg-slate-100" />
          ) : null}

          {detail && current ? (
            <div className="mt-6 space-y-6">
              <div
                className={`grid gap-5 ${canReview ? "lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]" : ""}`}
              >
                <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                          Current submission
                        </p>
                        <StatusBadge tone="neutral">
                          {`V${current.versionNumber}`}
                        </StatusBadge>
                        {current.isLate ? (
                          <StatusBadge tone="warning">Late</StatusBadge>
                        ) : null}
                        {current.isApproved ? (
                          <StatusBadge tone="success">Approved</StatusBadge>
                        ) : null}
                      </div>
                      <p className="mt-3 break-all text-base font-bold text-slate-900">
                        {current.originalFileName}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>{formatBytes(current.fileSizeBytes)}</span>
                        <span>{formatDate(current.submittedAt)}</span>
                        <span className="flex items-center gap-1">
                          <UserRound className="h-3.5 w-3.5" />
                          {current.uploadedByName}
                          {authorityRoleLabel(current.submitterRoleSnapshot)
                            ? ` · ${authorityRoleLabel(current.submitterRoleSnapshot)}`
                            : ""}
                        </span>
                      </div>
                      {current.submissionNote ? (
                        <p className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
                          {current.submissionNote}
                        </p>
                      ) : null}
                    </div>
                    <VersionActions
                      version={current}
                      downloadBusy={downloadVersionId === current.id}
                      onPreview={() => setPreviewVersion(current)}
                      onDownload={() => void downloadVersion(current)}
                    />
                  </div>

                  {current.review ? (
                    <div className="mt-5 border-t border-slate-200 pt-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Formal decision
                        </span>
                        <StatusBadge
                          tone={decisionTone(current.review.decision)}
                        >
                          {readable(current.review.decision)}
                        </StatusBadge>
                      </div>
                      {current.review.feedback ? (
                        <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-slate-700">
                          {current.review.feedback}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs text-slate-500">
                        Reviewed by {current.review.reviewedByName} ·{" "}
                        {formatDate(current.review.reviewedAt)}
                      </p>
                    </div>
                  ) : detail.status === "PENDING_REVIEW" ? (
                    <p className="mt-5 border-t border-slate-200 pt-4 text-sm font-medium text-amber-700">
                      Waiting for a Supervisor decision.
                    </p>
                  ) : null}
                </section>

                {canReview ? (
                  <section className="rounded-3xl border border-slate-200 p-5">
                    <h3 className="font-bold text-slate-900">
                      Formal Supervisor decision
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Record the decision and feedback for Version{" "}
                      {current.versionNumber}.
                    </p>

                    <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                      <Button
                        size="sm"
                        variant={
                          decision === "APPROVED" ? "primary" : "secondary"
                        }
                        onClick={() => setDecision("APPROVED")}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant={
                          decision === "CHANGES_REQUESTED"
                            ? "primary"
                            : "secondary"
                        }
                        onClick={() => setDecision("CHANGES_REQUESTED")}
                      >
                        Request changes
                      </Button>
                      <Button
                        size="sm"
                        variant={
                          decision === "REJECTED" ? "danger" : "secondary"
                        }
                        onClick={() => setDecision("REJECTED")}
                      >
                        Reject
                      </Button>
                    </div>

                    <label className="mt-4 block text-sm font-semibold text-slate-700">
                      Feedback{" "}
                      {decision === "APPROVED" ? (
                        <span className="font-normal text-slate-400">
                          (optional)
                        </span>
                      ) : null}
                      <textarea
                        value={feedback}
                        maxLength={4000}
                        onChange={(event) => setFeedback(event.target.value)}
                        placeholder="Explain the decision and what the Student should do next"
                        className="mt-2 min-h-32 w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                      />
                    </label>
                    <Button
                      className="mt-3"
                      fullWidth
                      variant="primary"
                      disabled={
                        reviewBusy ||
                        !decision ||
                        ((decision === "CHANGES_REQUESTED" ||
                          decision === "REJECTED") &&
                          !feedback.trim())
                      }
                      leftIcon={<CheckCircle2 className="h-4 w-4" />}
                      onClick={() => void submitReview()}
                    >
                      {reviewBusy ? "Recording…" : "Record decision"}
                    </Button>
                  </section>
                ) : null}
              </div>

              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileClock className="h-5 w-5 text-slate-500" />
                    <div>
                      <h3 className="font-bold text-slate-900">
                        Version history
                      </h3>
                      <p className="text-xs text-slate-500">
                        Review previous submissions and their decisions.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {detail.versionCount} version
                    {detail.versionCount === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="space-y-3">
                  {orderedVersions.map((version) => (
                    <article
                      key={version.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-slate-900">
                              Version {version.versionNumber}
                            </p>
                            {version.isCurrent ? (
                              <StatusBadge tone="neutral">Current</StatusBadge>
                            ) : null}
                            {version.isApproved ? (
                              <StatusBadge tone="success">Approved</StatusBadge>
                            ) : null}
                            {version.isLate ? (
                              <StatusBadge tone="warning">Late</StatusBadge>
                            ) : null}
                          </div>
                          <p className="mt-2 break-all text-sm font-semibold text-slate-700">
                            {version.originalFileName}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span>{formatBytes(version.fileSizeBytes)}</span>
                            <span>{formatDate(version.submittedAt)}</span>
                            <span>
                              Submitted by {version.uploadedByName}
                              {authorityRoleLabel(version.submitterRoleSnapshot)
                                ? ` · ${authorityRoleLabel(version.submitterRoleSnapshot)}`
                                : ""}
                            </span>
                          </div>
                        </div>
                        <VersionActions
                          version={version}
                          downloadBusy={downloadVersionId === version.id}
                          onPreview={() => setPreviewVersion(version)}
                          onDownload={() => void downloadVersion(version)}
                        />
                      </div>

                      {version.review ? (
                        <div className="mt-4 border-t border-slate-200 pt-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Formal review
                            </span>
                            <StatusBadge
                              tone={decisionTone(version.review.decision)}
                            >
                              {readable(version.review.decision)}
                            </StatusBadge>
                          </div>
                          {version.review.feedback ? (
                            <p className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-700">
                              {version.review.feedback}
                            </p>
                          ) : null}
                          <p className="mt-2 text-xs text-slate-500">
                            Reviewed by {version.review.reviewedByName} ·{" "}
                            {formatDate(version.review.reviewedAt)}
                          </p>
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </ModalShell>

      <SubmissionPreviewModal
        isOpen={Boolean(previewVersion)}
        projectId={projectId}
        submissionId={detail?.id ?? submission?.id ?? null}
        version={previewVersion}
        onClose={() => setPreviewVersion(null)}
      />
    </>
  );
}
