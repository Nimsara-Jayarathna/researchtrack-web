import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  Crown,
  Edit3,
  Eye,
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
  SubmissionVersion,
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
type WorkspaceGroupKey =
  "review" | "revision" | "open" | "completed" | "historical";
type WorkspaceGroup = {
  key: WorkspaceGroupKey;
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

function groupPresentation(key: WorkspaceGroupKey) {
  if (key === "review") {
    return {
      icon: CircleAlert,
      shell: "border-amber-100 bg-amber-50/35",
      header: "border-amber-100",
      iconClass: "bg-amber-100 text-amber-700",
      countClass: "border-amber-200 bg-white text-amber-700",
    };
  }
  if (key === "revision") {
    return {
      icon: Clock3,
      shell: "border-sky-100 bg-sky-50/35",
      header: "border-sky-100",
      iconClass: "bg-sky-100 text-sky-700",
      countClass: "border-sky-200 bg-white text-sky-700",
    };
  }
  if (key === "open") {
    return {
      icon: UserRound,
      shell: "border-slate-200 bg-slate-50/55",
      header: "border-slate-200",
      iconClass: "bg-slate-200 text-slate-700",
      countClass: "border-slate-200 bg-white text-slate-700",
    };
  }
  if (key === "completed") {
    return {
      icon: CheckCircle2,
      shell: "border-slate-200 bg-slate-50/65",
      header: "border-slate-200",
      iconClass: "bg-slate-200 text-slate-700",
      countClass: "border-slate-200 bg-white text-slate-700",
    };
  }
  return {
    icon: Archive,
    shell: "border-slate-200 bg-slate-50/45",
    header: "border-slate-200",
    iconClass: "bg-slate-100 text-slate-500",
    countClass: "border-slate-200 bg-white text-slate-600",
  };
}

function cardAccentClass(submission: ResearchSubmission | null) {
  if (!submission) return "border-l-slate-300";
  if (submission.status === "PENDING_REVIEW") return "border-l-amber-400";
  if (submission.status === "CHANGES_REQUESTED") return "border-l-sky-400";
  if (submission.status === "APPROVED") return "border-l-emerald-400";
  return "border-l-rose-400";
}

function SubmitterIdentity({
  requirement,
  version,
}: {
  requirement: SubmissionRequirement;
  version: SubmissionVersion | null;
}) {
  const roleSnapshot = authorityRoleLabel(version?.submitterRoleSnapshot);
  const role =
    roleSnapshot ??
    authorityRoleLabel(requirement.responsibility.responsibleStudentRole);
  const isLeader = version
    ? version.submitterRoleSnapshot === "PROJECT_LEADER"
    : requirement.responsibility.responsibleStudentRole === "PROJECT_LEADER";
  const name =
    version?.uploadedByName ??
    requirement.responsibility.responsibleStudentName ??
    "Submitter not assigned";
  const Icon = isLeader ? Crown : UserRound;

  return (
    <div
      className="flex min-w-0 items-center gap-2 text-xs text-slate-500"
      aria-label={role ? `${role}: ${name}` : name}
    >
      <span
        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
          isLeader
            ? "bg-amber-100 text-amber-700"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 truncate font-semibold text-slate-800">
        {name}
      </span>
      {role ? <span className="shrink-0 text-slate-400">· {role}</span> : null}
    </div>
  );
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
        className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 [&::-webkit-details-marker]:hidden"
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
      if (!isApiException(caught)) {
        setActionError("Unable to load the submission workspace.");
      }
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

  useEffect(() => {
    if (loading || requirements.length === 0) return;
    setExpandedRequirementId((current) => {
      if (
        current &&
        requirements.some((requirement) => requirement.id === current)
      ) {
        return current;
      }
      const pending = requirements.find(
        (requirement) =>
          submissionsByRequirement[requirement.id]?.status === "PENDING_REVIEW",
      );
      return pending?.id ?? null;
    });
  }, [loading, requirements, submissionsByRequirement]);

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
        description: "Current student versions waiting for your decision.",
        items: sortWorkspaceItems(needsReview),
      },
      {
        key: "revision",
        title: "Waiting on revision",
        description:
          "Changes were requested and the next action belongs to the responsible student.",
        items: sortWorkspaceItems(waitingRevision),
      },
      {
        key: "open",
        title: "Open requirements",
        description: "Requirements waiting for their first submission.",
        items: sortWorkspaceItems(openUnsubmitted),
      },
      {
        key: "completed",
        title: "Completed",
        description: "Approved and rejected submissions.",
        items: sortWorkspaceItems(completed),
      },
      {
        key: "historical",
        title: "Closed & archived",
        description: "Requirements that no longer accept submissions.",
        items: sortWorkspaceItems(historical),
      },
    ].filter((group) => group.items.length > 0) as WorkspaceGroup[];
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
    ) {
      return;
    }
    if (
      action === "archive" &&
      !window.confirm(
        `Archive “${requirement.title}”? Archived requirements are read-only.`,
      )
    ) {
      return;
    }

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
              const presentation = groupPresentation(group.key);
              const GroupIcon = presentation.icon;

              return (
                <section
                  key={group.key}
                  className={`overflow-hidden rounded-3xl border ${presentation.shell}`}
                >
                  <div
                    className={`flex items-start justify-between gap-4 border-b px-4 py-4 sm:px-5 ${presentation.header}`}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${presentation.iconClass}`}
                      >
                        <GroupIcon className="h-4 w-4" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900">
                          {group.title}
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {group.description}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex min-w-8 shrink-0 items-center justify-center rounded-full border px-2.5 py-1 text-xs font-bold ${presentation.countClass}`}
                    >
                      {group.items.length}
                    </span>
                  </div>

                  <div className="space-y-3 p-3 sm:p-4">
                    {group.items.map(({ requirement, submission }) => {
                      const version = currentVersion(submission);
                      const expanded = expandedRequirementId === requirement.id;
                      const isPending = submission?.status === "PENDING_REVIEW";

                      return (
                        <article
                          key={requirement.id}
                          className={`overflow-hidden rounded-2xl border border-l-4 border-slate-200 bg-white transition-all duration-200 ${cardAccentClass(
                            submission,
                          )} ${expanded ? "shadow-sm" : "shadow-none"}`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-stretch sm:gap-3">
                            <button
                              type="button"
                              className="min-w-0 flex-1 px-4 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-200 sm:px-5"
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
                              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                                Requirement
                              </p>
                              <div className="mt-1 flex items-start justify-between gap-3">
                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                  <h4 className="truncate font-bold text-slate-900">
                                    {requirement.title}
                                  </h4>
                                  <StatusBadge
                                    tone={requirementTone(requirement.status)}
                                    className="px-2.5 py-0.5 text-[10px] tracking-[0.14em]"
                                  >
                                    {requirement.status}
                                  </StatusBadge>
                                </div>
                                {submission ? (
                                  <StatusBadge
                                    tone={submissionTone(submission.status)}
                                    className="shrink-0 px-2.5 py-0.5 text-[10px] tracking-[0.14em]"
                                  >
                                    {readable(submission.status)}
                                  </StatusBadge>
                                ) : null}
                              </div>

                              <div className="mt-3 grid items-center gap-x-3 gap-y-1 text-xs text-slate-500 sm:grid-cols-[88px_minmax(0,1fr)_72px_220px]">
                                {version ? (
                                  <>
                                    <span className="font-semibold text-slate-700">
                                      Version {version.versionNumber}
                                    </span>
                                    <span
                                      className="min-w-0 truncate"
                                      title={version.originalFileName}
                                    >
                                      {version.originalFileName}
                                    </span>
                                    <span className="sm:text-right">
                                      {formatBytes(version.fileSizeBytes)}
                                    </span>
                                  </>
                                ) : (
                                  <span className="sm:col-span-3">
                                    No document submitted
                                  </span>
                                )}
                                <span className="flex items-center gap-1.5 text-slate-400 sm:justify-end sm:text-right">
                                  <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                                  {requirement.dueAt
                                    ? `Due ${formatDue(requirement.dueAt)}`
                                    : "No deadline"}
                                </span>
                              </div>

                              <div className="mt-3">
                                <SubmitterIdentity
                                  requirement={requirement}
                                  version={version}
                                />
                              </div>
                            </button>

                            <div className="flex shrink-0 items-center justify-end gap-2 px-4 pb-4 sm:px-0 sm:pb-0 sm:pr-4 sm:py-3">
                              {isPending && submission ? (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  leftIcon={<Eye className="h-4 w-4" />}
                                  onClick={() =>
                                    setDetailSubmission(submission)
                                  }
                                >
                                  Review submission
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
                                  className={`h-4 w-4 transition-transform duration-200 ease-out ${
                                    expanded ? "rotate-180" : ""
                                  }`}
                                />
                              </button>
                            </div>
                          </div>

                          <div
                            id={`supervisor-submission-${requirement.id}`}
                            aria-hidden={!expanded}
                            className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
                              expanded
                                ? "grid-rows-[1fr] opacity-100"
                                : "grid-rows-[0fr] opacity-0"
                            }`}
                          >
                            <div className="overflow-hidden">
                              <div className="border-t border-slate-200 px-4 pb-5 pt-4 sm:px-5">
                                {requirement.description ? (
                                  <p className="mb-4 max-w-4xl text-sm leading-6 text-slate-600">
                                    {requirement.description}
                                  </p>
                                ) : null}

                                <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600 sm:grid-cols-3">
                                  <div>
                                    <p className="font-semibold text-slate-700">
                                      Accepted formats
                                    </p>
                                    <p className="mt-1">
                                      {requirement.allowedFileTypes
                                        .map((type) => `.${type}`)
                                        .join(", ")}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-700">
                                      Maximum file size
                                    </p>
                                    <p className="mt-1">
                                      {formatBytes(
                                        requirement.maxFileSizeBytes,
                                      )}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-700">
                                      Deadline
                                    </p>
                                    <p className="mt-1">
                                      {formatDue(requirement.dueAt)}
                                    </p>
                                  </div>
                                </div>

                                {requirement.responsibility
                                  .requiresAssignment ? (
                                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                                    <div className="flex min-w-0 items-start gap-2 text-xs leading-5 text-amber-800">
                                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                      <span>
                                        {requirement.responsibility.mode ===
                                        "PROJECT_LEADER"
                                          ? "No Project Leader is assigned. Assign a leader or edit this requirement to choose a specific student."
                                          : "The assigned submitter is no longer an active project member. Choose another student."}
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
                                ) : null}

                                {submission && version ? (
                                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                    <div className="min-w-0">
                                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                                        Current version
                                      </p>
                                      <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                                        Version {version.versionNumber} ·{" "}
                                        {version.originalFileName}
                                      </p>
                                      <p className="mt-1 text-xs text-slate-500">
                                        Submitted by {version.uploadedByName}
                                        {authorityRoleLabel(
                                          version.submitterRoleSnapshot,
                                        )
                                          ? ` · ${authorityRoleLabel(version.submitterRoleSnapshot)}`
                                          : ""}
                                      </p>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant={
                                        isPending ? "primary" : "secondary"
                                      }
                                      leftIcon={<Eye className="h-4 w-4" />}
                                      onClick={() =>
                                        setDetailSubmission(submission)
                                      }
                                    >
                                      {isPending
                                        ? "Review submission"
                                        : "Submission details"}
                                    </Button>
                                  </div>
                                ) : (
                                  <p className="mt-4 text-sm text-slate-500">
                                    No document has been submitted for this
                                    requirement yet.
                                  </p>
                                )}

                                <div className="mt-4 flex justify-end">
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
