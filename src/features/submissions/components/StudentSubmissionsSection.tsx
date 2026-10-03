import { useCallback, useEffect, useState } from "react";
import { Download, RefreshCw, Upload } from "lucide-react";
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
import type { ResearchSubmission, SubmissionRequirement } from "../types";
import { SubmissionUploadModal } from "./SubmissionUploadModal";

type Props = { projectId: string };

function statusTone(status: SubmissionRequirement["status"]) {
  return status === "OPEN" ? "success" : status === "CLOSED" ? "warning" : "neutral";
}

export function StudentSubmissionsSection({ projectId }: Props) {
  const [requirements, setRequirements] = useState<SubmissionRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [uploadRequirement, setUploadRequirement] = useState<SubmissionRequirement | null>(null);
  const [openingSubmissionId, setOpeningSubmissionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next = await submissionApi.listRequirements(projectId);
      setRequirements(next);
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

  async function openCurrentFile(requirement: SubmissionRequirement) {
    const summary = requirement.submissionSummary;
    if (!summary) return;
    setOpeningSubmissionId(summary.id);
    try {
      const submission = await submissionApi.getSubmission(projectId, summary.id);
      const current = submission.versions.find((version) => version.isCurrent);
      if (!current) throw new Error("The current submission version could not be found.");
      const grant = await submissionApi.getDownloadUrl(
        projectId,
        submission.id,
        current.id,
        "inline",
      );
      window.open(grant.url, "_blank", "noopener,noreferrer");
    } finally {
      setOpeningSubmissionId(null);
    }
  }

  function handleCompleted(submission: ResearchSubmission) {
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
                  submission.versions.find((version) => version.isCurrent)
                    ?.versionNumber ?? null,
                lastSubmittedAt: submission.lastSubmittedAt,
              },
            }
          : requirement,
      ),
    );
  }

  return (
    <>
      <SectionCard
        title="Research Submissions"
        subtitle="Submit required documents securely. Completed versions cannot be deleted or replaced."
        actions={
          <IconActionButton
            label="Refresh submissions"
            onClick={() => void load()}
            disabled={loading}
            icon={<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />}
          />
        }
      >
        {error ? <ErrorState error={error} onRetry={() => void load()} /> : null}
        {!error && loading ? (
          <div className="space-y-3">
            {[0, 1].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        ) : null}
        {!error && !loading && requirements.length === 0 ? (
          <EmptyStateCard message="No submission requirements have been created for this project yet." />
        ) : null}
        {!error && !loading && requirements.length > 0 ? (
          <div className="space-y-4">
            {requirements.map((requirement) => {
              const summary = requirement.submissionSummary;
              const canSubmit = requirement.status === "OPEN" && !summary;
              return (
                <article key={requirement.id} className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900">{requirement.title}</h3>
                        <StatusBadge tone={statusTone(requirement.status)}>{requirement.status}</StatusBadge>
                        {summary ? <StatusBadge tone="warning">{summary.status}</StatusBadge> : null}
                      </div>
                      {requirement.description ? <p className="mt-2 text-sm text-slate-600">{requirement.description}</p> : null}
                    </div>
                    {canSubmit ? (
                      <Button
                        size="sm"
                        variant="primary"
                        leftIcon={<Upload className="h-4 w-4" />}
                        onClick={() => setUploadRequirement(requirement)}
                      >
                        Submit file
                      </Button>
                    ) : null}
                  </div>
                  <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-3">
                    <span>Types: {requirement.allowedFileTypes.map((type) => `.${type}`).join(", ")}</span>
                    <span>Max: {formatBytes(requirement.maxFileSizeBytes)}</span>
                    <span>Due: {requirement.dueAt ? new Date(requirement.dueAt).toLocaleString() : "No due date"}</span>
                  </div>
                  {summary ? (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
                      <div className="text-sm text-slate-600">
                        <p className="font-semibold text-slate-800">Version {summary.currentVersionNumber ?? summary.versionCount} recorded</p>
                        <p className="mt-1">Submitted {new Date(summary.lastSubmittedAt).toLocaleString()}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={openingSubmissionId === summary.id}
                        leftIcon={<Download className="h-4 w-4" />}
                        onClick={() => void openCurrentFile(requirement)}
                      >
                        Open current file
                      </Button>
                    </div>
                  ) : requirement.status !== "OPEN" ? (
                    <p className="mt-4 text-sm font-medium text-slate-500">This requirement is not accepting submissions.</p>
                  ) : null}
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
        onClose={() => setUploadRequirement(null)}
        onCompleted={handleCompleted}
      />
    </>
  );
}
