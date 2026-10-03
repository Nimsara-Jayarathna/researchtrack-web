import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Download,
  Eye,
  FileClock,
  FileText,
  RefreshCw,
  Upload,
  UserRound,
} from "lucide-react";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Button } from "@/components/ui/Button";
import { EmptyStateCard } from "@/components/ui/EmptyStateCard";
import { IconActionButton } from "@/components/ui/IconActionButton";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ApiError } from "@/types";
import { isApiException } from "@/services/apiClient";
import { submissionApi } from "../api/submissionApi";
import { formatBytes } from "../lib/submissionFiles";
import type {
  ResearchSubmission,
  SubmissionRequirement,
  SubmissionStatus,
  SubmissionVersion,
} from "../types";
import { SubmissionDetailModal } from "./SubmissionDetailModal";
import { SubmissionUploadModal } from "./SubmissionUploadModal";

type Props = { projectId: string };
type FileDisposition = "inline" | "attachment";

function requirementStatusTone(status: SubmissionRequirement["status"]) {
  return status === "OPEN"
    ? "success"
    : status === "CLOSED"
      ? "warning"
      : "neutral";
}

function submissionStatusTone(status: SubmissionStatus) {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "danger";
  return "warning";
}

function readableStatus(status: string) {
  return status.replace(/_/g, " ");
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

function currentVersion(submission: ResearchSubmission | null | undefined) {
  if (!submission) return null;
  return (
    submission.versions.find((version) => version.isCurrent) ??
    submission.versions.find(
      (version) => version.id === submission.currentVersionId,
    ) ??
    submission.versions[0] ??
    null
  );
}

function SubmissionFileDetails({ version }: { version: SubmissionVersion }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 shrink-0 text-slate-500" />
        <p className="truncate text-sm font-semibold text-slate-900">
          {version.originalFileName}
        </p>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <span>Version {version.versionNumber}</span>
        <span>{formatBytes(version.fileSizeBytes)}</span>
        <span>{formatDateTime(version.submittedAt)}</span>
        {version.isLate ? (
          <span className="font-semibold text-amber-700">Late submission</span>
        ) : null}
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
        <UserRound className="h-3.5 w-3.5" />
        <span>Submitted by {version.uploadedByName}</span>
      </div>
      {version.submissionNote ? (
        <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs leading-5 text-slate-600">
          {version.submissionNote}
        </p>
      ) : null}
    </div>
  );
}

export function StudentSubmissionsSection({ projectId }: Props) {
  const [requirements, setRequirements] = useState<SubmissionRequirement[]>([]);
  const [submissionsByRequirement, setSubmissionsByRequirement] = useState<
    Record<string, ResearchSubmission>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [uploadRequirement, setUploadRequirement] =
    useState<SubmissionRequirement | null>(null);
  const [uploadSubmission, setUploadSubmission] =
    useState<ResearchSubmission | null>(null);
  const [detailSubmission, setDetailSubmission] =
    useState<ResearchSubmission | null>(null);
  const [fileAction, setFileAction] = useState<string | null>(null);

  const load = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);
      try {
        const [nextRequirements, submissions] = await Promise.all([
          submissionApi.listRequirements(projectId),
          submissionApi.listSubmissions(projectId),
        ]);
        setRequirements(nextRequirements);
        setSubmissionsByRequirement(
          Object.fromEntries(
            submissions.map((item) => [item.requirementId, item]),
          ),
        );
        setError(null);
        setActionError(null);
      } catch (caught) {
        if (isApiException(caught)) setError(caught.apiError);
        else
          setActionError(
            "Unable to load the submission workspace. Please try again.",
          );
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [projectId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => {
    const submissions = Object.values(submissionsByRequirement);
    return {
      ready: requirements.filter(
        (r) => r.status === "OPEN" && !submissionsByRequirement[r.id],
      ).length,
      pending: submissions.filter((s) => s.status === "PENDING_REVIEW").length,
      revisions: submissions.filter((s) => s.status === "CHANGES_REQUESTED")
        .length,
    };
  }, [requirements, submissionsByRequirement]);

  async function openVersion(
    submission: ResearchSubmission,
    version: SubmissionVersion,
    disposition: FileDisposition,
  ) {
    const key = `${version.id}:${disposition}`;
    setFileAction(key);
    setActionError(null);
    try {
      const grant = await submissionApi.getDownloadUrl(
        projectId,
        submission.id,
        version.id,
        disposition,
      );
      window.open(grant.url, "_blank", "noopener,noreferrer");
    } catch (caught) {
      setActionError(
        isApiException(caught)
          ? caught.apiError.message
          : "Unable to create a secure file link. Please try again.",
      );
    } finally {
      setFileAction(null);
    }
  }

  function handleUpdated(submission: ResearchSubmission) {
    setSubmissionsByRequirement((current) => ({
      ...current,
      [submission.requirementId]: submission,
    }));
    setDetailSubmission((current) =>
      current?.id === submission.id ? submission : current,
    );
    setRequirements((current) =>
      current.map((requirement) =>
        requirement.id === submission.requirementId
          ? {
              ...requirement,
              submissionSummary: {
                id: submission.id,
                status: submission.status,
                versionCount: submission.versionCount,
                currentVersionNumber:
                  currentVersion(submission)?.versionNumber ?? null,
                lastSubmittedAt: submission.lastSubmittedAt,
              },
            }
          : requirement,
      ),
    );
    setActionError(null);
  }

  function startUpload(
    requirement: SubmissionRequirement,
    submission: ResearchSubmission | null,
  ) {
    setUploadRequirement(requirement);
    setUploadSubmission(submission);
  }

  return (
    <>
      <SectionCard
        title="Research Submissions"
        subtitle="Submit required documents, respond to formal Supervisor feedback, and keep every recorded version immutable."
        actions={
          <IconActionButton
            label="Refresh submissions"
            onClick={() => void load()}
            disabled={loading}
            icon={
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            }
          />
        }
      >
        {!loading && !error && requirements.length > 0 ? (
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Ready to submit
              </p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {summary.ready}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Pending review
              </p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {summary.pending}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Changes requested
              </p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {summary.revisions}
              </p>
            </div>
          </div>
        ) : null}

        {error ? (
          <ErrorState error={error} onRetry={() => void load()} />
        ) : null}
        {actionError ? (
          <div
            role="alert"
            className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {actionError}
          </div>
        ) : null}
        {!error && loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-44 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        ) : null}
        {!error && !loading && requirements.length === 0 ? (
          <EmptyStateCard message="No submission requirements have been created for this project yet." />
        ) : null}

        {!error && !loading && requirements.length > 0 ? (
          <div className="space-y-4">
            {requirements.map((requirement) => {
              const submission =
                submissionsByRequirement[requirement.id] ?? null;
              const version = currentVersion(submission);
              const canInitialSubmit =
                requirement.status === "OPEN" && !submission;
              const canResubmit =
                requirement.status === "OPEN" &&
                submission?.status === "CHANGES_REQUESTED";
              const isPastDue = Boolean(
                requirement.dueAt &&
                new Date(requirement.dueAt).getTime() < Date.now(),
              );
              const latestFeedback = version?.review?.feedback ?? null;

              return (
                <article
                  key={requirement.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900">
                          {requirement.title}
                        </h3>
                        <StatusBadge
                          tone={requirementStatusTone(requirement.status)}
                        >
                          {requirement.status}
                        </StatusBadge>
                        {submission ? (
                          <StatusBadge
                            tone={submissionStatusTone(submission.status)}
                          >
                            {readableStatus(submission.status)}
                          </StatusBadge>
                        ) : null}
                      </div>
                      {requirement.description ? (
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                          {requirement.description}
                        </p>
                      ) : null}
                    </div>

                    {canInitialSubmit || canResubmit ? (
                      <Button
                        size="sm"
                        variant="primary"
                        leftIcon={<Upload className="h-4 w-4" />}
                        onClick={() => startUpload(requirement, submission)}
                      >
                        {canResubmit ? "Upload revised version" : "Submit file"}
                      </Button>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-2 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600 sm:grid-cols-3">
                    <span>
                      <strong className="text-slate-700">Accepted:</strong>{" "}
                      {requirement.allowedFileTypes
                        .map((type) => `.${type}`)
                        .join(", ")}
                    </span>
                    <span>
                      <strong className="text-slate-700">Maximum:</strong>{" "}
                      {formatBytes(requirement.maxFileSizeBytes)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CalendarClock className="h-3.5 w-3.5" />
                      <strong className="text-slate-700">Due:</strong>{" "}
                      {requirement.dueAt
                        ? formatDateTime(requirement.dueAt)
                        : "No due date"}
                      {isPastDue && !submission ? (
                        <span className="font-semibold text-amber-700">
                          (late if submitted now)
                        </span>
                      ) : null}
                    </span>
                  </div>

                  {version?.review ? (
                    <div
                      className={`mt-4 rounded-2xl border p-4 ${submission?.status === "REJECTED" ? "border-rose-200 bg-rose-50" : submission?.status === "APPROVED" ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}
                    >
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-700">
                        Supervisor decision ·{" "}
                        {readableStatus(version.review.decision)}
                      </p>
                      {latestFeedback ? (
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                          {latestFeedback}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs text-slate-600">
                        Reviewed Version {version.versionNumber} by{" "}
                        {version.review.reviewedByName} on{" "}
                        {formatDateTime(version.review.reviewedAt)}.
                      </p>
                      {submission?.status === "CHANGES_REQUESTED" ? (
                        <p className="mt-2 text-xs font-semibold text-amber-800">
                          Uploading a revision will create Version{" "}
                          {submission.versionCount + 1}.
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {submission && version ? (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <SubmissionFileDetails version={version} />
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={fileAction !== null}
                            leftIcon={<Eye className="h-4 w-4" />}
                            onClick={() =>
                              void openVersion(submission, version, "inline")
                            }
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
                              void openVersion(
                                submission,
                                version,
                                "attachment",
                              )
                            }
                          >
                            {fileAction === `${version.id}:attachment`
                              ? "Preparing…"
                              : "Download"}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            leftIcon={<FileClock className="h-4 w-4" />}
                            onClick={() => setDetailSubmission(submission)}
                          >
                            Version history
                          </Button>
                        </div>
                      </div>
                      <p className="mt-4 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-500">
                        This recorded version is immutable.{" "}
                        {submission.status === "CHANGES_REQUESTED"
                          ? "A revised version is allowed because the Supervisor formally requested changes."
                          : "Additional uploads remain locked until the workflow explicitly allows a revision."}
                      </p>
                    </div>
                  ) : requirement.status !== "OPEN" ? (
                    <p className="mt-4 text-sm font-medium text-slate-500">
                      This requirement is not accepting submissions.
                    </p>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500">
                      No document has been submitted for this requirement yet.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        ) : null}
      </SectionCard>

      <SubmissionUploadModal
        isOpen={Boolean(uploadRequirement)}
        projectId={projectId}
        requirement={uploadRequirement}
        existingSubmission={uploadSubmission}
        onClose={() => {
          setUploadRequirement(null);
          setUploadSubmission(null);
        }}
        onCompleted={handleUpdated}
      />

      <SubmissionDetailModal
        isOpen={Boolean(detailSubmission)}
        projectId={projectId}
        submission={detailSubmission}
        viewerRole="STUDENT"
        onClose={() => setDetailSubmission(null)}
        onUpdated={handleUpdated}
      />
    </>
  );
}
