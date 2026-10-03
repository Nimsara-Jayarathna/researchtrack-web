import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  Eye,
  FileClock,
  MessageSquare,
  RefreshCw,
  Send,
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
  SubmissionComment,
  SubmissionParticipantRole,
  SubmissionStatus,
  SubmissionVersion,
} from "../types";

type Props = {
  isOpen: boolean;
  projectId: string;
  submission: ResearchSubmission | null;
  viewerRole: SubmissionParticipantRole;
  onClose: () => void;
  onUpdated: (submission: ResearchSubmission) => void;
};

type FileDisposition = "inline" | "attachment";

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

export function SubmissionDetailModal({
  isOpen,
  projectId,
  submission,
  viewerRole,
  onClose,
  onUpdated,
}: Props) {
  const [detail, setDetail] = useState<ResearchSubmission | null>(submission);
  const [comments, setComments] = useState<SubmissionComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileAction, setFileAction] = useState<string | null>(null);
  const [decision, setDecision] = useState<ReviewDecision | null>(null);
  const [feedback, setFeedback] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [comment, setComment] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);

  const load = useCallback(async () => {
    if (!submission) return;
    setLoading(true);
    try {
      const [nextDetail, nextComments] = await Promise.all([
        submissionApi.getSubmission(projectId, submission.id),
        submissionApi.listComments(projectId, submission.id),
      ]);
      setDetail(nextDetail);
      setComments(nextComments);
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
    setComment("");
    setError(null);
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

  async function openVersion(
    version: SubmissionVersion,
    disposition: FileDisposition,
  ) {
    if (!detail) return;
    const key = `${version.id}:${disposition}`;
    setFileAction(key);
    setError(null);
    try {
      const grant = await submissionApi.getDownloadUrl(
        projectId,
        detail.id,
        version.id,
        disposition,
      );
      window.open(grant.url, "_blank", "noopener,noreferrer");
    } catch (caught) {
      setError(
        isApiException(caught)
          ? caught.apiError.message
          : "Unable to create a secure file link.",
      );
    } finally {
      setFileAction(null);
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

  async function submitComment() {
    if (!detail || !comment.trim()) return;
    setCommentBusy(true);
    setError(null);
    try {
      const created = await submissionApi.addComment(projectId, detail.id, {
        versionId: current?.id ?? null,
        comment: comment.trim(),
      });
      setComments((items) => [...items, created]);
      setComment("");
    } catch (caught) {
      setError(
        isApiException(caught)
          ? caught.apiError.message
          : "Unable to post this comment.",
      );
    } finally {
      setCommentBusy(false);
    }
  }

  const canReview =
    viewerRole === "SUPERVISOR" &&
    detail?.status === "PENDING_REVIEW" &&
    current;

  return (
    <ModalShell
      isOpen={isOpen}
      containerClassName="fixed inset-0 z-50 flex items-center justify-center p-4"
      backdropClassName="absolute inset-0 bg-slate-950/45"
      dialogClassName="relative z-10 w-full max-w-5xl"
      onBackdropClick={reviewBusy || commentBusy ? undefined : onClose}
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
              Immutable version history, formal reviews, and project discussion.
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

        {detail ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)]">
            <div className="space-y-5">
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <FileClock className="h-5 w-5 text-slate-500" />
                  <h3 className="font-bold text-slate-900">Version history</h3>
                </div>
                <div className="space-y-3">
                  {detail.versions.map((version) => (
                    <article
                      key={version.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
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
                            <span className="flex items-center gap-1">
                              <UserRound className="h-3.5 w-3.5" />
                              {version.uploadedByName}
                            </span>
                          </div>
                          {version.submissionNote ? (
                            <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm leading-6 text-slate-600">
                              {version.submissionNote}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={fileAction !== null}
                            leftIcon={<Eye className="h-4 w-4" />}
                            onClick={() => void openVersion(version, "inline")}
                          >
                            {fileAction === `${version.id}:inline`
                              ? "Opening…"
                              : "Preview"}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={fileAction !== null}
                            leftIcon={<Download className="h-4 w-4" />}
                            onClick={() =>
                              void openVersion(version, "attachment")
                            }
                          >
                            {fileAction === `${version.id}:attachment`
                              ? "Preparing…"
                              : "Download"}
                          </Button>
                        </div>
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
                            <p className="mt-3 whitespace-pre-wrap rounded-xl bg-white px-3 py-3 text-sm leading-6 text-slate-700">
                              {version.review.feedback}
                            </p>
                          ) : null}
                          <p className="mt-2 text-xs text-slate-500">
                            Reviewed by {version.review.reviewedByName} ·{" "}
                            {formatDate(version.review.reviewedAt)}
                          </p>
                        </div>
                      ) : version.isCurrent &&
                        detail.status === "PENDING_REVIEW" ? (
                        <p className="mt-4 border-t border-slate-200 pt-3 text-xs font-medium text-amber-700">
                          Awaiting formal Supervisor review.
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>

              {canReview ? (
                <section className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-bold text-slate-900">
                    Formal Supervisor decision
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    The decision is permanently attached to Version{" "}
                    {current.versionNumber}. Request Changes and Reject require
                    feedback.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
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
                      variant={decision === "REJECTED" ? "danger" : "secondary"}
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
                      className="mt-2 min-h-28 w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    />
                  </label>
                  <div className="mt-3 flex justify-end">
                    <Button
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
                  </div>
                </section>
              ) : null}
            </div>

            <section className="h-fit rounded-2xl border border-slate-200 p-5 lg:sticky lg:top-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-slate-500" />
                <h3 className="font-bold text-slate-900">
                  Submission comments
                </h3>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Comments are append-only discussion and never change the formal
                submission status.
              </p>

              <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 px-3 py-4 text-sm text-slate-500">
                    No comments yet.
                  </p>
                ) : (
                  comments.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl bg-slate-50 px-3 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-slate-700">
                          {item.authorName} · {readable(item.authorRole)}
                        </span>
                        <span className="text-slate-400">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {item.comment}
                      </p>
                      {item.versionId ? (
                        <p className="mt-2 text-[11px] text-slate-400">
                          About Version{" "}
                          {detail.versions.find(
                            (version) => version.id === item.versionId,
                          )?.versionNumber ?? "?"}
                        </p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>

              <label className="mt-4 block text-sm font-semibold text-slate-700">
                Add comment
                <textarea
                  value={comment}
                  maxLength={2000}
                  onChange={(event) => setComment(event.target.value)}
                  className="mt-2 min-h-24 w-full resize-y rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-400"
                  placeholder="Write a project discussion comment"
                />
              </label>
              <Button
                className="mt-3"
                fullWidth
                variant="secondary"
                disabled={commentBusy || !comment.trim()}
                leftIcon={<Send className="h-4 w-4" />}
                onClick={() => void submitComment()}
              >
                {commentBusy ? "Posting…" : "Post comment"}
              </Button>
            </section>
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
}
