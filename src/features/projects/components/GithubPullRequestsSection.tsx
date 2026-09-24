import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, GitPullRequest } from "lucide-react";
import { buttonStyles } from "@/components/ui/Button";
import { isApiException } from "@/services/apiClient";
import type {
  PaginatedListResult,
  ProjectGitHubPullRequest,
  ProjectGitHubPullRequestPageOptions,
} from "../types";
import { GithubDetailsModal } from "./GithubDetailsModal";
import { GithubPullRequestCard } from "./GithubPullRequestCard";
import { GithubPullRequestDetailsContent } from "./GithubPullRequestDetailsContent";
import { GithubPullRequestsModalContent } from "./GithubPullRequestsModalContent";

const PREVIEW_SIZE = 5;

type FetchPullRequestsPage = (
  page: number,
  options?: ProjectGitHubPullRequestPageOptions,
) => Promise<PaginatedListResult<ProjectGitHubPullRequest>>;

type GithubPullRequestsSectionProps = {
  repositoryId: string | null;
  repositoryName?: string | null;
  refreshKey?: string | number | null;
  openListRequest?: number;
  initialPreview?: ProjectGitHubPullRequest[];
  initialTotal?: number;
  fetchPage: FetchPullRequestsPage;
};

function PreviewSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-100 bg-white p-4">
      <div className="h-4 w-3/4 rounded bg-slate-200" />
      <div className="mt-3 h-3 w-1/2 rounded bg-slate-100" />
      <div className="mt-4 h-3 w-1/3 rounded bg-slate-100" />
    </div>
  );
}

export function GithubPullRequestsSection({
  repositoryId,
  repositoryName,
  refreshKey,
  openListRequest = 0,
  initialPreview = [],
  initialTotal = 0,
  fetchPage,
}: GithubPullRequestsSectionProps) {
  const [preview, setPreview] = useState<ProjectGitHubPullRequest[]>(
    initialPreview.slice(0, PREVIEW_SIZE),
  );
  const [total, setTotal] = useState(initialTotal);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isListOpen, setIsListOpen] = useState(false);
  const [selectedPullRequest, setSelectedPullRequest] =
    useState<ProjectGitHubPullRequest | null>(null);
  const requestVersionRef = useRef(0);
  const lastHandledOpenRequestRef = useRef(openListRequest);
  const previousRepositoryIdRef = useRef(repositoryId);
  const lastSelectedRefreshKeyRef = useRef(refreshKey);

  const loadPreview = useCallback(async () => {
    if (!repositoryId) {
      requestVersionRef.current += 1;
      setPreview([]);
      setTotal(0);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }

    const requestVersion = ++requestVersionRef.current;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await fetchPage(1, { size: PREVIEW_SIZE, status: "all" });
      if (requestVersion !== requestVersionRef.current) return;
      setPreview(result.items.slice(0, PREVIEW_SIZE));
      setTotal(result.total ?? result.items.length + (result.hasMore ? 1 : 0));
    } catch (error) {
      if (requestVersion !== requestVersionRef.current) return;
      setErrorMessage(
        isApiException(error)
          ? error.apiError.message
          : "Unable to load pull requests right now.",
      );
    } finally {
      if (requestVersion === requestVersionRef.current) setIsLoading(false);
    }
  }, [fetchPage, repositoryId]);

  useEffect(() => {
    const repositoryChanged = previousRepositoryIdRef.current !== repositoryId;
    previousRepositoryIdRef.current = repositoryId;
    if (!repositoryChanged) return;

    requestVersionRef.current += 1;
    setIsListOpen(false);
    setSelectedPullRequest(null);
    lastSelectedRefreshKeyRef.current = refreshKey;
    setPreview(initialPreview.slice(0, PREVIEW_SIZE));
    setTotal(initialTotal);
    setErrorMessage(null);
    setIsLoading(false);
  }, [initialPreview, initialTotal, refreshKey, repositoryId]);

  useEffect(() => {
    setPreview(initialPreview.slice(0, PREVIEW_SIZE));
    setTotal(initialTotal);
    setSelectedPullRequest((current) => {
      if (!current) return null;
      return (
        initialPreview.find(
          (item) => item.gitHubPullRequestId === current.gitHubPullRequestId,
        ) ?? current
      );
    });
  }, [initialPreview, initialTotal]);

  useEffect(() => {
    if (!repositoryId || refreshKey == null || !selectedPullRequest) return;
    if (lastSelectedRefreshKeyRef.current === refreshKey) return;
    lastSelectedRefreshKeyRef.current = refreshKey;
    let cancelled = false;
    const reconcileSelectedPullRequest = async () => {
      try {
        const result = await fetchPage(1, {
          size: 1,
          status: "all",
          search: `#${selectedPullRequest.number}`,
        });
        if (cancelled) return;
        const updated = result.items.find(
          (item) =>
            item.gitHubPullRequestId ===
            selectedPullRequest.gitHubPullRequestId,
        );
        if (updated) setSelectedPullRequest(updated);
      } catch {
        // Keep the currently open PR visible if background revalidation fails.
      }
    };
    void reconcileSelectedPullRequest();
    return () => {
      cancelled = true;
    };
  }, [fetchPage, refreshKey, repositoryId, selectedPullRequest]);

  useEffect(() => {
    if (openListRequest === lastHandledOpenRequestRef.current) {
      return;
    }

    lastHandledOpenRequestRef.current = openListRequest;
    if (repositoryId) {
      setSelectedPullRequest(null);
      setIsListOpen(true);
    }
  }, [openListRequest, repositoryId]);

  function openDetails(pullRequest: ProjectGitHubPullRequest) {
    setIsListOpen(false);
    setSelectedPullRequest(pullRequest);
  }

  return (
    <>
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <GitPullRequest className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-800">
                Pull Requests
              </h2>
              {repositoryName ? (
                <p className="text-[11px] font-medium text-slate-400">
                  Recent evidence from {repositoryName}
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            className="group flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-violet-600 transition-all hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => setIsListOpen(true)}
            disabled={!repositoryId || isLoading || preview.length === 0}
          >
            View all
            {total > PREVIEW_SIZE ? (
              <span className="normal-case tracking-normal">({total})</span>
            ) : null}
            <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {isLoading && preview.length === 0 ? (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <PreviewSkeleton key={`pr-preview-skeleton-${index}`} />
            ))}
          </div>
        ) : errorMessage ? (
          <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50/70 p-4">
            <p className="text-sm text-rose-700">{errorMessage}</p>
            <button
              type="button"
              className={buttonStyles({
                variant: "secondary",
                size: "sm",
                className: "mt-3",
              })}
              onClick={() => void loadPreview()}
            >
              Retry
            </button>
          </div>
        ) : preview.length > 0 ? (
          <div className="mt-6 space-y-3">
            {preview.map((pullRequest) => (
              <GithubPullRequestCard
                key={pullRequest.gitHubPullRequestId}
                pullRequest={pullRequest}
                onClick={() => openDetails(pullRequest)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-sm font-semibold text-slate-500">
              No pull requests recorded for this repository yet.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Pull request evidence will appear after the next successful GitHub
              synchronization.
            </p>
          </div>
        )}
      </section>

      <GithubDetailsModal
        isOpen={isListOpen}
        title="Pull Requests"
        onClose={() => setIsListOpen(false)}
      >
        <GithubPullRequestsModalContent
          isOpen={isListOpen}
          refreshKey={refreshKey}
          fetchPage={fetchPage}
          onSelectPullRequest={openDetails}
        />
      </GithubDetailsModal>

      <GithubDetailsModal
        isOpen={selectedPullRequest !== null}
        title={
          selectedPullRequest
            ? `Pull Request #${selectedPullRequest.number}`
            : "Pull Request"
        }
        onClose={() => setSelectedPullRequest(null)}
      >
        {selectedPullRequest ? (
          <GithubPullRequestDetailsContent pullRequest={selectedPullRequest} />
        ) : null}
      </GithubDetailsModal>
    </>
  );
}
