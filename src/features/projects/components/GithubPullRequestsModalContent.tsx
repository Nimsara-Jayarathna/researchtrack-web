import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { buttonStyles } from "@/components/ui/Button";
import { isApiException } from "@/services/apiClient";
import type {
  PaginatedListResult,
  ProjectGitHubPullRequest,
  ProjectGitHubPullRequestPageOptions,
  ProjectGitHubPullRequestStatus,
} from "../types";
import { GithubPullRequestCard } from "./GithubPullRequestCard";

const PAGE_SIZE = 8;
const statusOptions: Array<{
  value: ProjectGitHubPullRequestStatus;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "draft", label: "Draft" },
  { value: "merged", label: "Merged" },
  { value: "closed", label: "Closed" },
];

type FetchPullRequestsPage = (
  page: number,
  options?: ProjectGitHubPullRequestPageOptions,
) => Promise<PaginatedListResult<ProjectGitHubPullRequest>>;

type GithubPullRequestsModalContentProps = {
  isOpen: boolean;
  refreshKey?: string | number | null;
  fetchPage: FetchPullRequestsPage;
  onSelectPullRequest: (pullRequest: ProjectGitHubPullRequest) => void;
};

function PullRequestSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-100 bg-white p-4">
      <div className="h-4 w-3/4 rounded bg-slate-200" />
      <div className="mt-3 h-3 w-1/2 rounded bg-slate-100" />
      <div className="mt-4 h-3 w-1/3 rounded bg-slate-100" />
    </div>
  );
}

export function GithubPullRequestsModalContent({
  isOpen,
  refreshKey,
  fetchPage,
  onSelectPullRequest,
}: GithubPullRequestsModalContentProps) {
  const [items, setItems] = useState<ProjectGitHubPullRequest[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState<ProjectGitHubPullRequestStatus>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestVersionRef = useRef(0);
  const lastRefreshKeyRef = useRef(refreshKey);

  const load = useCallback(
    async (
      targetPage: number,
      targetStatus: ProjectGitHubPullRequestStatus,
      targetSearch: string,
    ) => {
      const requestVersion = ++requestVersionRef.current;
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const result = await fetchPage(targetPage, {
          size: PAGE_SIZE,
          status: targetStatus,
          search: targetSearch || undefined,
        });
        if (requestVersion !== requestVersionRef.current) return;
        setItems(result.items);
        setPage(result.page);
        setHasMore(result.hasMore);
        setTotal(result.total);
      } catch (error) {
        if (requestVersion !== requestVersionRef.current) return;
        setErrorMessage(
          isApiException(error)
            ? error.apiError.message
            : "Unable to load pull requests right now.",
        );
      } finally {
        if (requestVersion === requestVersionRef.current) {
          setIsLoading(false);
        }
      }
    },
    [fetchPage],
  );

  useEffect(() => {
    if (!isOpen) {
      requestVersionRef.current += 1;
      lastRefreshKeyRef.current = refreshKey;
      return;
    }
    setPage(1);
    void load(1, status, search);
  }, [isOpen, load, search, status]);

  useEffect(() => {
    if (!isOpen || items.length === 0 || refreshKey == null) return;
    if (lastRefreshKeyRef.current === refreshKey) return;
    lastRefreshKeyRef.current = refreshKey;
    void load(page, status, search);
  }, [isOpen, items.length, load, page, refreshKey, search, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const totalPages =
    typeof total === "number"
      ? Math.max(1, Math.ceil(total / PAGE_SIZE))
      : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Pull request status"
        >
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatus(option.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                status === option.value
                  ? "border-violet-200 bg-violet-50 text-violet-700"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <label className="relative block w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            maxLength={200}
            placeholder="Search title, author, branch or #"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-50"
          />
        </label>
      </div>

      {isLoading && items.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <PullRequestSkeleton key={`pr-modal-skeleton-${index}`} />
          ))}
        </div>
      ) : errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm text-rose-700">{errorMessage}</p>
          <button
            type="button"
            className={buttonStyles({
              variant: "secondary",
              size: "sm",
              className: "mt-3",
            })}
            onClick={() => void load(page, status, search)}
          >
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center">
          <p className="text-sm font-semibold text-slate-600">
            No pull requests found.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Try another status or search term.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((pullRequest) => (
            <GithubPullRequestCard
              key={pullRequest.gitHubPullRequestId}
              pullRequest={pullRequest}
              onClick={() => onSelectPullRequest(pullRequest)}
            />
          ))}
        </div>
      )}

      {!isLoading && !errorMessage && items.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-xs font-medium text-slate-400">
            {typeof total === "number"
              ? `${total} pull request${total === 1 ? "" : "s"}`
              : `Page ${page}`}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={buttonStyles({ variant: "secondary", size: "sm" })}
              disabled={page <= 1 || isLoading}
              onClick={() => void load(page - 1, status, search)}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </button>
            <span className="min-w-20 text-center text-xs font-semibold text-slate-500">
              {totalPages ? `Page ${page} of ${totalPages}` : `Page ${page}`}
            </span>
            <button
              type="button"
              className={buttonStyles({ variant: "secondary", size: "sm" })}
              disabled={!hasMore || isLoading}
              onClick={() => void load(page + 1, status, search)}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
