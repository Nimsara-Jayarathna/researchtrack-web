import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Crown,
  Download,
  FileClock,
  FileText,
  RefreshCw,
  Upload,
  UserRound,
  UsersRound,
} from "lucide-react";
import { ErrorState } from "@/components/feedback/ErrorState";
import { useAuthStateValue } from "@/features/auth/state/authState";
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
import { SubmissionPreviewButton } from "./SubmissionPreviewButton";
import { SubmissionPreviewModal } from "./SubmissionPreviewModal";
import { SubmissionUploadModal } from "./SubmissionUploadModal";

type Props = { projectId: string };
type StudentItem = {
  requirement: SubmissionRequirement;
  submission: ResearchSubmission | null;
};

type StudentGroup = {
  key: string;
  title: string;
  description: string;
  items: StudentItem[];
};

type PreviewTarget = {
  submission: ResearchSubmission;
  version: SubmissionVersion;
};

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


function authorityRoleLabel(value: string | null | undefined) {
  if (value === "PROJECT_LEADER") return "Project Leader";
  if (value === "ASSIGNED_STUDENT") return "Assigned submitter";
  return null;
}

function readableStatus(status: string) {
  return status.replace(/_/g, " ");
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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

function dueSortValue(requirement: SubmissionRequirement) {
  if (!requirement.dueAt) return Number.MAX_SAFE_INTEGER;
  const value = new Date(requirement.dueAt).getTime();
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
}

function sortItems(items: StudentItem[]) {
  return [...items].sort((a, b) => {
    const due = dueSortValue(a.requirement) - dueSortValue(b.requirement);
    if (due !== 0) return due;
    return a.requirement.title.localeCompare(b.requirement.title);
  });
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
        <span>
          Submitted by {version.uploadedByName}
          {authorityRoleLabel(version.submitterRoleSnapshot)
            ? ` · ${authorityRoleLabel(version.submitterRoleSnapshot)}`
            : ""}
        </span>
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
  const { user } = useAuthStateValue();
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
  const [previewTarget, setPreviewTarget] = useState<PreviewTarget | null>(
    null,
  );
  const [downloadVersionId, setDownloadVersionId] = useState<string | null>(
    null,
  );
  const [expandedRequirementId, setExpandedRequirementId] = useState<
    string | null
  >(null);

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

  const canCurrentUserSubmit = useCallback(
    (requirement: SubmissionRequirement) =>
      Boolean(
        user?.id &&
          !requirement.responsibility.requiresAssignment &&
          requirement.responsibility.responsibleStudentId === user.id,
      ),
    [user?.id],
  );

  useEffect(() => {
    if (loading || requirements.length === 0) return;
    setExpandedRequirementId((current) => {
      if (
        current &&
        requirements.some((requirement) => requirement.id === current)
      ) {
        return current;
      }
      const revision = requirements.find(
        (requirement) =>
          requirement.status === "OPEN" &&
          canCurrentUserSubmit(requirement) &&
          submissionsByRequirement[requirement.id]?.status ===
            "CHANGES_REQUESTED",
      );
      return revision?.id ?? null;
    });
  }, [
    loading,
    requirements,
    submissionsByRequirement,
    canCurrentUserSubmit,
  ]);

  const summary = useMemo(() => {
    const submissions = Object.values(submissionsByRequirement);
    return {
      ready: requirements.filter(
        (r) =>
          r.status === "OPEN" &&
          !submissionsByRequirement[r.id] &&
          canCurrentUserSubmit(r),
      ).length,
      pending: submissions.filter((s) => s.status === "PENDING_REVIEW").length,
      revisions: requirements.filter(
        (requirement) =>
          submissionsByRequirement[requirement.id]?.status ===
            "CHANGES_REQUESTED" && canCurrentUserSubmit(requirement),
      ).length,
    };
  }, [requirements, submissionsByRequirement, canCurrentUserSubmit]);

  const groups = useMemo<StudentGroup[]>(() => {
    const items: StudentItem[] = requirements.map((requirement) => ({
      requirement,
      submission: submissionsByRequirement[requirement.id] ?? null,
    }));

    const actionNeeded = items.filter(
      (item) =>
        item.requirement.status === "OPEN" &&
        canCurrentUserSubmit(item.requirement) &&
        (item.submission?.status === "CHANGES_REQUESTED" || !item.submission),
    );
    const teamOpen = items.filter(
      (item) =>
        item.requirement.status === "OPEN" &&
        !canCurrentUserSubmit(item.requirement) &&
        (item.submission?.status === "CHANGES_REQUESTED" || !item.submission),
    );
    const inReview = items.filter(
      (item) => item.submission?.status === "PENDING_REVIEW",
    );
    const completed = items.filter(
      (item) =>
        item.submission?.status === "APPROVED" ||
        item.submission?.status === "REJECTED",
    );
    const unavailable = items.filter(
      (item) =>
        !actionNeeded.includes(item) &&
        !teamOpen.includes(item) &&
        !inReview.includes(item) &&
        !completed.includes(item),
    );

    return [
      {
        key: "action",
        title: "Action needed",
        description: "Revisions and unsubmitted requirements appear first.",
        items: sortItems(actionNeeded).sort((a, b) => {
          const ar = a.submission?.status === "CHANGES_REQUESTED" ? 0 : 1;
          const br = b.submission?.status === "CHANGES_REQUESTED" ? 0 : 1;
          return ar - br;
        }),
      },
      {
        key: "team",
        title: "Team submissions",
        description:
          "Open requirements currently assigned to another project member.",
        items: sortItems(teamOpen),
      },
      {
        key: "review",
        title: "In review",
        description:
          "Submitted work currently waiting for a Supervisor decision.",
        items: sortItems(inReview),
      },
      {
        key: "completed",
        title: "Completed",
        description: "Approved and rejected submissions.",
        items: sortItems(completed),
      },
      {
        key: "unavailable",
        title: "Closed & archived",
        description: "Requirements that are no longer accepting uploads.",
        items: sortItems(unavailable),
      },
    ].filter((group) => group.items.length > 0);
  }, [requirements, submissionsByRequirement, canCurrentUserSubmit]);

  async function downloadVersion(
    submission: ResearchSubmission,
    version: SubmissionVersion,
  ) {
    setDownloadVersionId(version.id);
    setActionError(null);
    try {
      const grant = await submissionApi.getDownloadUrl(
        projectId,
        submission.id,
        version.id,
        "attachment",
      );
      const anchor = document.createElement("a");
      anchor.href = grant.url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.click();
    } catch {
      setActionError("Unable to download this file. Please try again.");
    } finally {
      setDownloadVersionId(null);
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
    setExpandedRequirementId(submission.requirementId);
    setActionError(null);
  }

  function startUpload(
    requirement: SubmissionRequirement,
    submission: ResearchSubmission | null,
  ) {
    if (!canCurrentUserSubmit(requirement)) {
      setActionError(
        requirement.responsibility.requiresAssignment
          ? "This requirement needs a responsible submitter before another version can be uploaded."
          : `Only ${requirement.responsibility.responsibleStudentName ?? "the responsible submitter"} can upload the official version.`,
      );
      return;
    }
    setUploadRequirement(requirement);
    setUploadSubmission(submission);
  }

  return (
    <>
      <SectionCard
        title="Research Submissions"
        subtitle="Submit research documents, review Supervisor feedback, and track previous versions."
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
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                Ready to submit
              </p>
              <p className="mt-1 text-2xl font-bold text-sky-900">
                {summary.ready}
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Pending review
              </p>
              <p className="mt-1 text-2xl font-bold text-amber-900">
                {summary.pending}
              </p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                Changes requested
              </p>
              <p className="mt-1 text-2xl font-bold text-rose-900">
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
                className="h-32 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        ) : null}
        {!error && !loading && requirements.length === 0 ? (
          <EmptyStateCard message="No submission requirements have been created for this project yet." />
        ) : null}

        {!error && !loading && requirements.length > 0 ? (
          <div className="space-y-7">
            {groups.map((group) => {
              const groupIcon =
                group.key === "action" ? (
                  <Upload className="h-4 w-4" />
                ) : group.key === "team" ? (
                  <UsersRound className="h-4 w-4" />
                ) : group.key === "review" ? (
                  <FileClock className="h-4 w-4" />
                ) : group.key === "completed" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Archive className="h-4 w-4" />
                );

              return (
                <section
                  key={group.key}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500">
                        {groupIcon}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900">
                          {group.title}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {group.description}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex min-w-8 items-center justify-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
                      {group.items.length}
                    </span>
                  </div>

                  <div className="space-y-3 border-t border-slate-200 p-4">
                    {group.items.map(({ requirement, submission }) => {
                      const version = currentVersion(submission);
                      const isResponsible = canCurrentUserSubmit(requirement);
                      const canInitialSubmit =
                        requirement.status === "OPEN" &&
                        !submission &&
                        isResponsible;
                      const canResubmit =
                        requirement.status === "OPEN" &&
                        submission?.status === "CHANGES_REQUESTED" &&
                        isResponsible;
                      const needsAction = canInitialSubmit || canResubmit;
                      const isPastDue = Boolean(
                        requirement.dueAt &&
                          new Date(requirement.dueAt).getTime() < Date.now(),
                      );
                      const latestFeedback = version?.review?.feedback ?? null;
                      const expanded =
                        expandedRequirementId === requirement.id;
                      const displayRole =
                        version?.submitterRoleSnapshot ??
                        requirement.responsibility.responsibleStudentRole;
                      const displayPerson =
                        version?.uploadedByName ??
                        requirement.responsibility.responsibleStudentName;
                      const accentClass = needsAction
                        ? "border-l-sky-400"
                        : submission?.status === "PENDING_REVIEW"
                          ? "border-l-amber-400"
                          : submission?.status === "APPROVED"
                            ? "border-l-emerald-400"
                            : submission?.status === "REJECTED"
                              ? "border-l-rose-400"
                              : submission?.status === "CHANGES_REQUESTED"
                                ? "border-l-orange-400"
                                : "border-l-slate-300";

                      return (
                        <article
                          key={requirement.id}
                          className={`overflow-hidden rounded-2xl border border-l-4 border-slate-200 bg-white transition-shadow duration-200 ${accentClass} ${expanded ? "shadow-sm" : ""}`}
                        >
                          <div className="flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-center">
                            <button
                              type="button"
                              className="min-w-0 flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                              aria-expanded={expanded}
                              aria-controls={`student-submission-${requirement.id}`}
                              onClick={() =>
                                setExpandedRequirementId((current) =>
                                  current === requirement.id
                                    ? null
                                    : requirement.id,
                                )
                              }
                            >
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                Requirement
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <h4 className="font-bold text-slate-900">
                                  {requirement.title}
                                </h4>
                                <StatusBadge
                                  tone={requirementStatusTone(
                                    requirement.status,
                                  )}
                                >
                                  {requirement.status}
                                </StatusBadge>
                              </div>

                              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                {version ? (
                                  <>
                                    <span className="font-semibold text-slate-700">
                                      Version {version.versionNumber}
                                    </span>
                                    <span className="max-w-[28rem] truncate">
                                      {version.originalFileName}
                                    </span>
                                    <span>
                                      {formatBytes(version.fileSizeBytes)}
                                    </span>
                                  </>
                                ) : (
                                  <span>No document submitted</span>
                                )}
                                <span className="flex items-center gap-1.5">
                                  <CalendarClock className="h-3.5 w-3.5" />
                                  {requirement.dueAt
                                    ? `Due ${formatDateTime(requirement.dueAt)}`
                                    : "No deadline"}
                                </span>
                              </div>

                              <div className="mt-2 flex min-w-0 items-center gap-2 text-xs text-slate-500">
                                {displayRole === "PROJECT_LEADER" ? (
                                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                                    <Crown className="h-3.5 w-3.5" />
                                  </span>
                                ) : (
                                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                    <UserRound className="h-3.5 w-3.5" />
                                  </span>
                                )}
                                <span className="text-slate-400">
                                  {version ? "Submitted by" : "Responsible"}
                                </span>
                                <span className="truncate font-semibold text-slate-700">
                                  {displayPerson ?? "Not assigned"}
                                </span>
                                {authorityRoleLabel(displayRole) ? (
                                  <>
                                    <span className="text-slate-300">·</span>
                                    <span className="truncate text-slate-400">
                                      {authorityRoleLabel(displayRole)}
                                    </span>
                                  </>
                                ) : null}
                              </div>
                            </button>

                            <div className="flex shrink-0 flex-wrap items-center gap-2">
                              {submission ? (
                                <StatusBadge
                                  tone={submissionStatusTone(
                                    submission.status,
                                  )}
                                >
                                  {readableStatus(submission.status)}
                                </StatusBadge>
                              ) : needsAction ? (
                                <StatusBadge tone="warning">
                                  Ready to submit
                                </StatusBadge>
                              ) : null}
                              {needsAction ? (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  leftIcon={<Upload className="h-4 w-4" />}
                                  onClick={() =>
                                    startUpload(requirement, submission)
                                  }
                                >
                                  {canResubmit
                                    ? "Upload revised version"
                                    : "Submit file"}
                                </Button>
                              ) : null}
                              <button
                                type="button"
                                aria-label={
                                  expanded
                                    ? `Collapse ${requirement.title}`
                                    : `Expand ${requirement.title}`
                                }
                                aria-expanded={expanded}
                                onClick={() =>
                                  setExpandedRequirementId((current) =>
                                    current === requirement.id
                                      ? null
                                      : requirement.id,
                                  )
                                }
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-200"
                              >
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform duration-200 ease-out ${expanded ? "rotate-180" : ""}`}
                                />
                              </button>
                            </div>
                          </div>

                          <div
                            id={`student-submission-${requirement.id}`}
                            className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
                              expanded
                                ? "grid-rows-[1fr] opacity-100"
                                : "grid-rows-[0fr] opacity-0"
                            }`}
                          >
                            <div className="overflow-hidden">
                              <div className="border-t border-slate-200 px-4 pb-5 pt-4 sm:px-5">
                                {requirement.description ? (
                                  <div className="mb-4">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                      Requirement description
                                    </p>
                                    <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-600">
                                      {requirement.description}
                                    </p>
                                  </div>
                                ) : null}

                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                    Requirement details
                                  </p>
                                  <div className="mt-2 grid gap-3 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600 sm:grid-cols-3">
                                    <span>
                                      <strong className="text-slate-700">
                                        Accepted formats
                                      </strong>
                                      <span className="mt-1 block">
                                        {requirement.allowedFileTypes
                                          .map((type) => `.${type}`)
                                          .join(", ")}
                                      </span>
                                    </span>
                                    <span>
                                      <strong className="text-slate-700">
                                        Maximum file size
                                      </strong>
                                      <span className="mt-1 block">
                                        {formatBytes(
                                          requirement.maxFileSizeBytes,
                                        )}
                                      </span>
                                    </span>
                                    <span>
                                      <strong className="text-slate-700">
                                        Deadline
                                      </strong>
                                      <span className="mt-1 flex flex-wrap items-center gap-1.5">
                                        <CalendarClock className="h-3.5 w-3.5" />
                                        {requirement.dueAt
                                          ? formatDateTime(requirement.dueAt)
                                          : "No deadline"}
                                        {isPastDue && !submission ? (
                                          <span className="font-semibold text-amber-700">
                                            Late if submitted now
                                          </span>
                                        ) : null}
                                      </span>
                                    </span>
                                  </div>
                                </div>

                                <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                    Responsible submitter
                                  </p>
                                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                                    {requirement.responsibility
                                      .responsibleStudentRole ===
                                    "PROJECT_LEADER" ? (
                                      <Crown className="h-4 w-4 text-amber-600" />
                                    ) : (
                                      <UserRound className="h-4 w-4 text-slate-400" />
                                    )}
                                    <span className="font-semibold">
                                      {requirement.responsibility
                                        .responsibleStudentName ??
                                        "Not assigned"}
                                    </span>
                                    {authorityRoleLabel(
                                      requirement.responsibility
                                        .responsibleStudentRole,
                                    ) ? (
                                      <span className="text-slate-400">
                                        · {authorityRoleLabel(
                                          requirement.responsibility
                                            .responsibleStudentRole,
                                        )}
                                      </span>
                                    ) : null}
                                  </div>
                                  {!isResponsible &&
                                  !requirement.responsibility
                                    .requiresAssignment ? (
                                    <p className="mt-2 text-xs leading-5 text-slate-500">
                                      Only the responsible Student can upload
                                      the official version for this
                                      requirement.
                                    </p>
                                  ) : null}
                                </div>

                                {version?.review ? (
                                  <div
                                    className={`mt-4 rounded-2xl border p-4 ${
                                      submission?.status === "REJECTED"
                                        ? "border-rose-200 bg-rose-50"
                                        : submission?.status === "APPROVED"
                                          ? "border-emerald-200 bg-emerald-50"
                                          : "border-amber-200 bg-amber-50"
                                    }`}
                                  >
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-xs font-bold uppercase tracking-wide text-slate-700">
                                        Supervisor decision
                                      </p>
                                      <StatusBadge
                                        tone={submissionStatusTone(
                                          version.review.decision,
                                        )}
                                      >
                                        {readableStatus(
                                          version.review.decision,
                                        )}
                                      </StatusBadge>
                                    </div>
                                    {latestFeedback ? (
                                      <div className="mt-3">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                          Supervisor feedback
                                        </p>
                                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                                          {latestFeedback}
                                        </p>
                                      </div>
                                    ) : null}
                                    <p className="mt-2 text-xs text-slate-600">
                                      Reviewed Version {version.versionNumber} by{" "}
                                      {version.review.reviewedByName} on{" "}
                                      {formatDateTime(
                                        version.review.reviewedAt,
                                      )}.
                                    </p>
                                    {submission?.status ===
                                    "CHANGES_REQUESTED" ? (
                                      <p className="mt-2 text-xs font-semibold text-amber-800">
                                        The next upload will be Version{" "}
                                        {submission.versionCount + 1}.
                                      </p>
                                    ) : null}
                                  </div>
                                ) : submission?.status ===
                                  "PENDING_REVIEW" ? (
                                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">
                                      Supervisor decision
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-amber-800">
                                      Waiting for Supervisor review.
                                    </p>
                                  </div>
                                ) : null}

                                {submission && version ? (
                                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                      Current version
                                    </p>
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                      <SubmissionFileDetails version={version} />
                                      <div className="flex shrink-0 flex-wrap gap-2">
                                        <SubmissionPreviewButton
                                          version={version}
                                          busy={
                                            downloadVersionId === version.id
                                          }
                                          onPreview={() =>
                                            setPreviewTarget({
                                              submission,
                                              version,
                                            })
                                          }
                                        />
                                        <Button
                                          size="sm"
                                          variant="secondary"
                                          disabled={
                                            downloadVersionId !== null
                                          }
                                          leftIcon={
                                            <Download className="h-4 w-4" />
                                          }
                                          onClick={() =>
                                            void downloadVersion(
                                              submission,
                                              version,
                                            )
                                          }
                                        >
                                          {downloadVersionId === version.id
                                            ? "Preparing…"
                                            : "Download"}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="secondary"
                                          leftIcon={
                                            <FileClock className="h-4 w-4" />
                                          }
                                          onClick={() =>
                                            setDetailSubmission(submission)
                                          }
                                        >
                                          Submission details
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ) : requirement.status !== "OPEN" ? (
                                  <p className="mt-4 text-sm font-medium text-slate-500">
                                    This requirement is not accepting
                                    submissions.
                                  </p>
                                ) : (
                                  <p className="mt-4 text-sm text-slate-500">
                                    No document has been submitted for this
                                    requirement yet.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
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

      <SubmissionPreviewModal
        isOpen={Boolean(previewTarget)}
        projectId={projectId}
        submissionId={previewTarget?.submission.id ?? null}
        version={previewTarget?.version ?? null}
        onClose={() => setPreviewTarget(null)}
      />
    </>
  );
}
