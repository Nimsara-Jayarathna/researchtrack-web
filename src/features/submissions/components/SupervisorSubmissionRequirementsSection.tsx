import { useCallback, useEffect, useState } from "react";
import {
  Archive,
  Edit3,
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
import type { SubmissionRequirement } from "../types";
import { RequirementEditorModal } from "./RequirementEditorModal";

type Props = { projectId: string };

type Action = "close" | "reopen" | "archive" | "delete";

function statusTone(status: SubmissionRequirement["status"]) {
  return status === "OPEN"
    ? "success"
    : status === "CLOSED"
      ? "warning"
      : "neutral";
}

export function SupervisorSubmissionRequirementsSection({ projectId }: Props) {
  const [requirements, setRequirements] = useState<SubmissionRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<SubmissionRequirement | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRequirements(await submissionApi.listRequirements(projectId));
      setError(null);
    } catch (caught) {
      setError(isApiException(caught) ? caught.apiError : null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  function upsert(requirement: SubmissionRequirement) {
    setRequirements((current) => {
      const exists = current.some((item) => item.id === requirement.id);
      return exists
        ? current.map((item) =>
            item.id === requirement.id ? requirement : item,
          )
        : [requirement, ...current];
    });
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
      upsert(next);
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
        title="Submission Requirements"
        subtitle="Define required research documents and their upload constraints. Submitted versions are immutable and cannot be deleted here."
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
          <div className="space-y-4">
            {requirements.map((requirement) => (
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
                      <StatusBadge tone={statusTone(requirement.status)}>
                        {requirement.status}
                      </StatusBadge>
                      {requirement.submissionSummary ? (
                        <StatusBadge tone="warning">
                          {requirement.submissionSummary.status}
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
                    {requirement.submissionSummary ? (
                      <p className="mt-3 text-sm font-medium text-slate-600">
                        Version{" "}
                        {requirement.submissionSummary.currentVersionNumber ??
                          requirement.submissionSummary.versionCount}{" "}
                        submitted{" "}
                        {new Date(
                          requirement.submissionSummary.lastSubmittedAt,
                        ).toLocaleString()}
                        .
                      </p>
                    ) : null}
                  </div>
                  {requirement.status !== "ARCHIVED" ? (
                    <div className="flex flex-wrap justify-end gap-2">
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
                          onClick={() => void runAction(requirement, "close")}
                        >
                          Close
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busyId === requirement.id}
                          leftIcon={<RotateCcw className="h-4 w-4" />}
                          onClick={() => void runAction(requirement, "reopen")}
                        >
                          Reopen
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busyId === requirement.id}
                        leftIcon={<Archive className="h-4 w-4" />}
                        onClick={() => void runAction(requirement, "archive")}
                      >
                        Archive
                      </Button>
                      {!requirement.submissionSummary ? (
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={busyId === requirement.id}
                          leftIcon={<Trash2 className="h-4 w-4" />}
                          onClick={() => void runAction(requirement, "delete")}
                        >
                          Delete
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </SectionCard>

      <RequirementEditorModal
        isOpen={editorOpen}
        projectId={projectId}
        requirement={editing}
        onClose={() => setEditorOpen(false)}
        onSaved={upsert}
      />
    </>
  );
}
