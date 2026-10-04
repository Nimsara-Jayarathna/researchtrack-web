import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Crown,
  Edit3,
  Eye,
  FileClock,
  FileText,
  Lock,
  MoreHorizontal,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  UserRound,
} from "lucide-react";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Button } from "@/components/ui/Button";
import { EmptyStateCard } from "@/components/ui/EmptyStateCard";
import { IconActionButton } from "@/components/ui/IconActionButton";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { isApiException } from "@/services/apiClient";
import type { ApiError } from "@/types";
import { submissionApi } from "../api/submissionApi";
import { formatBytes } from "../lib/submissionFiles";
import type {
  ResearchSubmission,
  SubmissionRequirement,
  SubmissionStatus,
} from "../types";
import { RequirementEditorModal } from "./RequirementEditorModal";
import { SubmissionDetailModal } from "./SubmissionDetailModal";

type ProjectPerson = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
};

type Props = {
  projectId: string;
  projectLeader: ProjectPerson | null;
  studentMembers: ProjectPerson[];
  onManageMembers: () => void;
};
type Action = "close" | "reopen" | "archive" | "delete";
type WorkspaceItem = {
  requirement: SubmissionRequirement;
  submission: ResearchSubmission | null;
};

type WorkspaceGroup = {
  key: string;
  title: string;
  description: string;
  items: WorkspaceItem[];
};

function requirementTone(status: SubmissionRequirement["status"]) {
  return status === "OPEN"
    ? "success"
    : status === "CLOSED"
      ? "warning"
      : "neutral";
}

function submissionTone(status: SubmissionStatus) {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "danger";
  return "warning";
}


function authorityRoleLabel(value: string | null | undefined) {
  if (value === "PROJECT_LEADER") return "Project Leader";
  if (value === "ASSIGNED_STUDENT") return "Assigned submitter";
  return null;
}

function readable(value: string) {
  return value.replace(/_/g, " ");
}

function formatDue(value: string | null) {
  if (!value) return "No deadline";
  return new Date(value).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function currentVersionNumber(submission: ResearchSubmission) {
  return (
    submission.versions.find(
      (version) => version.id === submission.currentVersionId,
    )?.versionNumber ??
    submission.versions.find((version) => version.isCurrent)?.versionNumber ??
    submission.versionCount
  );
}

function currentVersion(submission: ResearchSubmission | null) {
  if (!submission) return null;
  return (
    submission.versions.find(
      (version) => version.id === submission.currentVersionId,
    ) ??
    submission.versions.find((version) => version.isCurrent) ??
    submission.versions[0] ??
    null
  );
}

function dueSortValue(requirement: SubmissionRequirement) {
  if (!requirement.dueAt) return Number.MAX_SAFE_INTEGER;
  const value = new Date(requirement.dueAt).getTime();
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
}

function sortWorkspaceItems(items: WorkspaceItem[]) {
  return [...items].sort((a, b) => {
    const due = dueSortValue(a.requirement) - dueSortValue(b.requirement);
    if (due !== 0) return due;
    return a.requirement.title.localeCompare(b.requirement.title);
  });
}

function RequirementActionsMenu({
  requirement,
  submission,
  busy,
  onEdit,
  onAction,
}: {
  requirement: SubmissionRequirement;
  submission: ResearchSubmission | null;
  busy: boolean;
  onEdit: () => void;
  onAction: (action: Action) => void;
}) {
  if (requirement.status === "ARCHIVED") return null;

  const closeDetails = (target: EventTarget & HTMLElement) => {
    target.closest("details")?.removeAttribute("open");
  };

  return (
    <details className="relative">
      <summary
        aria-label={`Manage ${requirement.title}`}
        className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 [&::-webkit-details-marker]:hidden"
      >
        <MoreHorizontal className="h-4 w-4" />
      </summary>
      <div className="absolute right-0 z-30 mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
        <button
          type="button"
          disabled={busy}
          onClick={(event) => {
            closeDetails(event.currentTarget);
            onEdit();
          }}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <Edit3 className="h-4 w-4" /> Edit requirement
        </button>
        {requirement.status === "OPEN" ? (
          <button
            type="button"
            disabled={busy}
            onClick={(event) => {
              closeDetails(event.currentTarget);
              onAction("close");
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <Lock className="h-4 w-4" /> Close requirement
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={(event) => {
              closeDetails(event.currentTarget);
              onAction("reopen");
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" /> Reopen requirement
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={(event) => {
            closeDetails(event.currentTarget);
            onAction("archive");
          }}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <Archive className="h-4 w-4" /> Archive requirement
        </button>
        {!submission ? (
          <button
            type="button"
            disabled={busy}
            onClick={(event) => {
              closeDetails(event.currentTarget);
              onAction("delete");
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" /> Delete unused requirement
          </button>
        ) : null}
      </div>
    </details>
  );
}

export function SupervisorSubmissionRequirementsSection({
  projectId,
  projectLeader,
  studentMembers,
  onManageMembers,
}: Props) {
  const [requirements, setRequirements] = useState<SubmissionRequirement[]>([]);
  const [submissions, setSubmissions] = useState<ResearchSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<SubmissionRequirement | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [detailSubmission, setDetailSubmission] =
    useState<ResearchSubmission | null>(null);
  const [expandedRequirementId, setExpandedRequirementId] = useState<
    string | null
  >(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextRequirements, nextSubmissions] = await Promise.all([
        submissionApi.listRequirements(projectId),
        submissionApi.listSubmissions(projectId),
      ]);
      setRequirements(nextRequirements);
      setSubmissions(nextSubmissions);
      setError(null);
      setActionError(null);
    } catch (caught) {
      setError(isApiException(caught) ? caught.apiError : null);
      if (!isApiException(caught))
        setActionError("Unable to load the submission workspace.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submissionsByRequirement = useMemo(
    () =>
      Object.fromEntries(
        submissions.map((submission) => [submission.requirementId, submission]),
      ),
    [submissions],
  );

  const summary = useMemo(
    () => ({
      pending: submissions.filter(
        (submission) => submission.status === "PENDING_REVIEW",
      ).length,
      changes: submissions.filter(
        (submission) => submission.status === "CHANGES_REQUESTED",
      ).length,
      approved: submissions.filter(
        (submission) => submission.status === "APPROVED",
      ).length,
      rejected: submissions.filter(
        (submission) => submission.status === "REJECTED",
      ).length,
    }),
    [submissions],
  );

  const groups = useMemo<WorkspaceGroup[]>(() => {
    const items = requirements.map((requirement) => ({
      requirement,
      submission: submissionsByRequirement[requirement.id] ?? null,
    }));

    const needsReview = items.filter(
      (item) => item.submission?.status === "PENDING_REVIEW",
    );
    const waitingRevision = items.filter(
      (item) => item.submission?.status === "CHANGES_REQUESTED",
    );
    const openUnsubmitted = items.filter(
      (item) => item.requirement.status === "OPEN" && !item.submission,
    );
    const completed = items.filter(
      (item) =>
        item.submission?.status === "APPROVED" ||
        item.submission?.status === "REJECTED",
    );
    const historical = items.filter(
      (item) =>
        !item.submission &&
        (item.requirement.status === "CLOSED" ||
          item.requirement.status === "ARCHIVED"),
    );

    return [
      {
        key: "review",
        title: "Needs review",
        description:
          "Current student versions waiting for your Supervisor decision.",
        items: sortWorkspaceItems(needsReview),
      },
      {
        key: "revision",
        title: "Waiting on revision",
        description:
          "Changes were requested and the next action belongs to the students.",
        items: sortWorkspaceItems(waitingRevision),
      },
      {
        key: "open",
        title: "Open requirements",
        description: "Requirements accepting their first student submission.",
        items: sortWorkspaceItems(openUnsubmitted),
      },
      {
        key: "completed",
        title: "Completed reviews",
        description:
          "Approved and rejected submissions are kept below active work.",
        items: sortWorkspaceItems(completed),
      },
      {
        key: "historical",
        title: "Closed & archived",
        description: "Requirements that no longer accept submissions.",
        items: sortWorkspaceItems(historical),
      },
    ].filter((group) => group.items.length > 0);
  }, [requirements, submissionsByRequirement]);

  function upsertRequirement(requirement: SubmissionRequirement) {
    setRequirements((current) => {
      const exists = current.some((item) => item.id === requirement.id);
      return exists
        ? current.map((item) =>
            item.id === requirement.id ? requirement : item,
          )
        : [requirement, ...current];
    });
  }

  function handleSubmissionUpdated(updated: ResearchSubmission) {
    setSubmissions((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
    setDetailSubmission((current) =>
      current?.id === updated.id ? updated : current,
    );
    setRequirements((current) =>
      current.map((requirement) =>
        requirement.id === updated.requirementId
          ? {
              ...requirement,
              submissionSummary: {
                id: updated.id,
                status: updated.status,
                versionCount: updated.versionCount,
                currentVersionNumber: currentVersionNumber(updated),
                lastSubmittedAt: updated.lastSubmittedAt,
              },
            }
          : requirement,
      ),
    );
  }

  async function runAction(requirement: SubmissionRequirement, action: Action) {
    if (
      action === "delete" &&
      !window.confirm(
        `Delete “${requirement.title}”? Only unused requirements can be deleted.`,
      )
    )
      return;
    if (
      action === "archive" &&
      !window.confirm(
        `Archive “${requirement.title}”? Archived requirements are read-only.`,
      )
    )
      return;

    setBusyId(requirement.id);
    setActionError(null);
    try {
      if (action === "delete") {
        await submissionApi.deleteRequirement(projectId, requirement.id);
        setRequirements((current) =>
          current.filter((item) => item.id !== requirement.id),
        );
        return;
      }
      const next =
        action === "close"
          ? await submissionApi.closeRequirement(projectId, requirement.id)
          : action === "reopen"
            ? await submissionApi.reopenRequirement(projectId, requirement.id)
            : await submissionApi.archiveRequirement(projectId, requirement.id);
      upsertRequirement(next);
    } catch (caught) {
      setActionError(
        isApiException(caught)
          ? caught.apiError.message
          : "Unable to update this requirement.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <SectionCard
        title="Research Submissions"
        subtitle="Create requirements and work through the submissions that need your attention first."
        actions={
          <>
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
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setEditing(null);
                setEditorOpen(true);
              }}
            >
              New requirement
            </Button>
          </>
        }
      >
        {!loading && !error ? (
          <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Needs review
              </p>
              <p className="mt-1 text-2xl font-bold text-amber-900">
                {summary.pending}
              </p>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                Waiting on revision
              </p>
              <p className="mt-1 text-2xl font-bold text-sky-900">
                {summary.changes}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Approved
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-900">
                {summary.approved}
              </p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                Rejected
              </p>
              <p className="mt-1 text-2xl font-bold text-rose-900">
                {summary.rejected}
              </p>
            </div>
          </div>
        ) : null}

        {error ? (
          <ErrorState error={error} onRetry={() => void load()} />
        ) : null}
        {actionError ? (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {actionError}
          </div>
        ) : null}
        {!error && loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-36 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        ) : null}
        {!error && !loading && requirements.length === 0 ? (
          <EmptyStateCard
            message="No submission requirements yet. Create one before students can submit documents."
            action={
              <Button
                variant="primary"
                onClick={() => {
                  setEditing(null);
                  setEditorOpen(true);
                }}
              >
                Create requirement
              </Button>
            }
          />
        ) : null}

        {!error && !loading && requirements.length > 0 ? (
          <div className="space-y-7">
            {groups.map((group) => {
              const groupIcon =
                group.key === "review" ? (
                  <Eye className="h-4 w-4" />
                ) : group.key === "revision" ? (
                  <FileClock className="h-4 w-4" />
                ) : group.key === "open" ? (
                  <FileText className="h-4 w-4" />
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
                      const isPending =
                        submission?.status === "PENDING_REVIEW";
                      const expanded =
                        expandedRequirementId === requirement.id;
                      const primaryLabel = isPending
                        ? "Review submission"
                        : submission?.status === "APPROVED"
                          ? "View approved submission"
                          : submission?.status === "REJECTED"
                            ? "View rejected submission"
                            : submission?.status === "CHANGES_REQUESTED"
                              ? "View requested changes"
                              : "View submission";
                      const displayRole =
                        version?.submitterRoleSnapshot ??
                        requirement.responsibility.responsibleStudentRole;
                      const displayPerson =
                        version?.uploadedByName ??
                        requirement.responsibility.responsibleStudentName;
                      const accentClass = isPending
                        ? "border-l-amber-400"
                        : submission?.status === "CHANGES_REQUESTED"
                          ? "border-l-sky-400"
                          : submission?.status === "APPROVED"
                            ? "border-l-emerald-400"
                            : submission?.status === "REJECTED"
                              ? "border-l-rose-400"
                              : requirement.status === "OPEN"
                                ? "border-l-slate-300"
                                : "border-l-slate-200";

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
                              aria-controls={`supervisor-submission-${requirement.id}`}
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
                                  tone={requirementTone(requirement.status)}
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
                                    ? `Due ${formatDue(requirement.dueAt)}`
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
                                  tone={submissionTone(submission.status)}
                                >
                                  {readable(submission.status)}
                                </StatusBadge>
                              ) : null}
                              {submission ? (
                                <Button
                                  size="sm"
                                  variant={isPending ? "primary" : "secondary"}
                                  leftIcon={<Eye className="h-4 w-4" />}
                                  onClick={() =>
                                    setDetailSubmission(submission)
                                  }
                                >
                                  {primaryLabel}
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
                              <RequirementActionsMenu
                                requirement={requirement}
                                submission={submission}
                                busy={busyId === requirement.id}
                                onEdit={() => {
                                  setEditing(requirement);
                                  setEditorOpen(true);
                                }}
                                onAction={(action) =>
                                  void runAction(requirement, action)
                                }
                              />
                            </div>
                          </div>

                          <div
                            id={`supervisor-submission-${requirement.id}`}
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

                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                  Requirement details
                                </p>
                                <div className="mt-2 grid gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-600 sm:grid-cols-3">
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
                                    <span className="mt-1 block">
                                      {formatDue(requirement.dueAt)}
                                    </span>
                                  </span>
                                </div>

                                {requirement.responsibility
                                  .requiresAssignment ? (
                                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                                    <div className="flex min-w-0 items-start gap-2 text-xs leading-5 text-amber-800">
                                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                      <span>
                                        {requirement.responsibility.mode ===
                                        "PROJECT_LEADER"
                                          ? "No Project Leader is assigned. Assign a leader or choose a specific Student for this requirement."
                                          : "The assigned submitter is no longer an active project member. Choose another Student."}
                                      </span>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={onManageMembers}
                                    >
                                      Manage project team
                                    </Button>
                                  </div>
                                ) : (
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
                                  </div>
                                )}

                                {submission && version ? (
                                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                        Current version
                                      </p>
                                      <span className="text-xs font-semibold text-slate-500">
                                        Version {version.versionNumber} of{" "}
                                        {submission.versionCount}
                                      </span>
                                    </div>
                                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                      <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                          Submitted file
                                        </p>
                                        <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                                          {version.originalFileName}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                          {formatBytes(version.fileSizeBytes)}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                          Submitted by
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-slate-800">
                                          {version.uploadedByName}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                          {authorityRoleLabel(
                                            version.submitterRoleSnapshot,
                                          ) ?? "Project member"}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                          Submitted on
                                        </p>
                                        <p className="mt-1 text-sm text-slate-700">
                                          {new Date(
                                            version.submittedAt,
                                          ).toLocaleString()}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                          Submission status
                                        </p>
                                        <div className="mt-1">
                                          <StatusBadge
                                            tone={submissionTone(
                                              submission.status,
                                            )}
                                          >
                                            {readable(submission.status)}
                                          </StatusBadge>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-4 text-sm text-slate-500">
                                    No submission has been made for this
                                    requirement yet.
                                  </div>
                                )}

                                {isPending ? (
                                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">
                                      Next action
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-amber-800">
                                      Review the current version and record a
                                      Supervisor decision.
                                    </p>
                                  </div>
                                ) : null}
                                {submission?.status ===
                                "CHANGES_REQUESTED" ? (
                                  <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-700">
                                      Next action
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-sky-800">
                                      Waiting for the responsible Student to
                                      submit a revised version.
                                    </p>
                                  </div>
                                ) : null}
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

      <RequirementEditorModal
        isOpen={editorOpen}
        projectId={projectId}
        requirement={editing}
        projectLeader={projectLeader}
        studentMembers={studentMembers}
        onManageMembers={onManageMembers}
        onClose={() => setEditorOpen(false)}
        onSaved={upsertRequirement}
      />

      <SubmissionDetailModal
        isOpen={Boolean(detailSubmission)}
        projectId={projectId}
        submission={detailSubmission}
        viewerRole="SUPERVISOR"
        onClose={() => setDetailSubmission(null)}
        onUpdated={handleSubmissionUpdated}
      />
    </>
  );
}
