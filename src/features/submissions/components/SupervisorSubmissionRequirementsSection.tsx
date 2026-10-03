import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  Edit3,
  Eye,
  FileCheck2,
  FileClock,
  Lock,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
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

type Props = { projectId: string };
type Action = "close" | "reopen" | "archive" | "delete";

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

function readable(value: string) {
  return value.replace(/_/g, " ");
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

export function SupervisorSubmissionRequirementsSection({ projectId }: Props) {
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
  const pending = useMemo(
    () =>
      submissions.filter(
        (submission) => submission.status === "PENDING_REVIEW",
      ),
    [submissions],
  );
  const summary = useMemo(
    () => ({
      pending: pending.length,
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
    [pending.length, submissions],
  );

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
        title="Submission Review"
        subtitle="Review the exact current version, leave project comments, and record one immutable formal decision per version."
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
        {!loading && !error ? (
          <div className="mb-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Pending review
              </p>
              <p className="mt-1 text-xl font-bold text-amber-900">
                {summary.pending}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Changes requested
              </p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {summary.changes}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Approved
              </p>
              <p className="mt-1 text-xl font-bold text-emerald-900">
                {summary.approved}
              </p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                Rejected
              </p>
              <p className="mt-1 text-xl font-bold text-rose-900">
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
            {[0, 1].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        ) : null}
        {!error && !loading && pending.length === 0 ? (
          <EmptyStateCard message="No submissions are waiting for formal review." />
        ) : null}
        {!error && !loading && pending.length > 0 ? (
          <div className="space-y-3">
            {pending.map((submission) => {
              const version =
                submission.versions.find(
                  (item) => item.id === submission.currentVersionId,
                ) ?? submission.versions[0];
              return (
                <article
                  key={submission.id}
                  className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900">
                          {submission.requirement.title}
                        </h3>
                        <StatusBadge tone="warning">Pending review</StatusBadge>
                      </div>
                      {version ? (
                        <p className="mt-2 text-sm text-slate-600">
                          Version {version.versionNumber} ·{" "}
                          {version.originalFileName} · submitted by{" "}
                          {version.uploadedByName}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-slate-500">
                        Submitted{" "}
                        {new Date(submission.lastSubmittedAt).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      leftIcon={<Eye className="h-4 w-4" />}
                      onClick={() => setDetailSubmission(submission)}
                    >
                      Review submission
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </SectionCard>

      <div className="mt-6" />

      <SectionCard
        title="Submission Requirements"
        subtitle="Define required research documents and their upload constraints. Existing versions and formal reviews remain immutable."
        actions={
          <>
            <IconActionButton
              label="Refresh requirements"
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
          <div className="space-y-4">
            {requirements.map((requirement) => {
              const submission =
                submissionsByRequirement[requirement.id] ?? null;
              return (
                <article
                  key={requirement.id}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900">
                          {requirement.title}
                        </h3>
                        <StatusBadge tone={requirementTone(requirement.status)}>
                          {requirement.status}
                        </StatusBadge>
                        {submission ? (
                          <StatusBadge tone={submissionTone(submission.status)}>
                            {readable(submission.status)}
                          </StatusBadge>
                        ) : null}
                      </div>
                      {requirement.description ? (
                        <p className="mt-2 text-sm text-slate-600">
                          {requirement.description}
                        </p>
                      ) : null}
                      <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-3">
                        <span>
                          Types:{" "}
                          {requirement.allowedFileTypes
                            .map((type) => `.${type}`)
                            .join(", ")}
                        </span>
                        <span>
                          Max: {formatBytes(requirement.maxFileSizeBytes)}
                        </span>
                        <span>
                          Due:{" "}
                          {requirement.dueAt
                            ? new Date(requirement.dueAt).toLocaleString()
                            : "No due date"}
                        </span>
                      </div>
                      {submission ? (
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <FileClock className="h-4 w-4" />
                            {submission.versionCount} version
                            {submission.versionCount === 1 ? "" : "s"}
                          </span>
                          <span>
                            Current: V{currentVersionNumber(submission)}
                          </span>
                          {submission.approvedVersionId ? (
                            <span className="flex items-center gap-1 font-semibold text-emerald-700">
                              <FileCheck2 className="h-4 w-4" />
                              Approved version recorded
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      {submission ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          leftIcon={<Eye className="h-4 w-4" />}
                          onClick={() => setDetailSubmission(submission)}
                        >
                          View submission
                        </Button>
                      ) : null}
                      {requirement.status !== "ARCHIVED" ? (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={busyId === requirement.id}
                            leftIcon={<Edit3 className="h-4 w-4" />}
                            onClick={() => {
                              setEditing(requirement);
                              setEditorOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          {requirement.status === "OPEN" ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={busyId === requirement.id}
                              leftIcon={<Lock className="h-4 w-4" />}
                              onClick={() =>
                                void runAction(requirement, "close")
                              }
                            >
                              Close
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={busyId === requirement.id}
                              leftIcon={<RotateCcw className="h-4 w-4" />}
                              onClick={() =>
                                void runAction(requirement, "reopen")
                              }
                            >
                              Reopen
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={busyId === requirement.id}
                            leftIcon={<Archive className="h-4 w-4" />}
                            onClick={() =>
                              void runAction(requirement, "archive")
                            }
                          >
                            Archive
                          </Button>
                          {!submission ? (
                            <Button
                              size="sm"
                              variant="danger"
                              disabled={busyId === requirement.id}
                              leftIcon={<Trash2 className="h-4 w-4" />}
                              onClick={() =>
                                void runAction(requirement, "delete")
                              }
                            >
                              Delete
                            </Button>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </SectionCard>

      <RequirementEditorModal
        isOpen={editorOpen}
        projectId={projectId}
        requirement={editing}
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
