import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toVersionedApiPath } from "@/app/config/apiVersion";
import { normalizeSyncStatus } from "@/lib/syncStatus";
import { usePageAwarePolling } from "@/hooks/usePageAwarePolling";
import { studentApi } from "../../api/studentApi";
import type { CanonicalSyncStatus } from "@/lib/syncStatus";
import type { ApiError } from "@/types";
import { isApiException } from "@/services/apiClient";
import type {
  PaginatedListResult,
  ProjectGitHubContributor,
  ProjectGitHubRecentCommit,
  ProjectGitHubPullRequest,
  ProjectGitHubPullRequestPageOptions,
} from "@/features/projects/types";
import type {
  ProjectGitHubRepositories,
  ProjectRepositoryLink,
} from "@/features/shared/types/github.types";
import type { ProjectGitHubActivity } from "../../types";

const PROJECTS_BASE_PATH = toVersionedApiPath("/api/projects");

type FetchProjectGitHubDashboard = (
  projectId: string,
  forceRefresh?: boolean,
  linkedRepositoryId?: string | null,
) => Promise<ProjectGitHubActivity>;

type FetchActivityPage = (
  projectId: string,
  page: number,
  linkedRepositoryId?: string | null,
) => Promise<PaginatedListResult<ProjectGitHubRecentCommit>>;

type FetchContributorsPage = (
  projectId: string,
  page: number,
  linkedRepositoryId?: string | null,
) => Promise<PaginatedListResult<ProjectGitHubContributor>>;

type FetchPullRequestsPage = (
  projectId: string,
  page: number,
  linkedRepositoryId: string | null | undefined,
  options?: ProjectGitHubPullRequestPageOptions,
) => Promise<PaginatedListResult<ProjectGitHubPullRequest>>;

type UseStudentProjectGitHubDashboardParams = {
  projectId: string | undefined;
  githubRepositories: ProjectGitHubRepositories | null | undefined;
  fetchDashboard: FetchProjectGitHubDashboard;
  fetchActivityPage: FetchActivityPage;
  fetchContributorsPage: FetchContributorsPage;
  fetchPullRequestsPage: FetchPullRequestsPage;
  reloadRepositories: () => Promise<ProjectGitHubRepositories | null>;
};

type UseStudentProjectGitHubDashboardResult = {
  enabledRepositories: ProjectRepositoryLink[];
  selectedRepoId: string | null;
  isRepoSelectorOpen: boolean;
  setRepoSelectorOpen: (open: boolean) => void;
  activeRepository: ProjectRepositoryLink | null;
  activeRepositorySyncStatus: CanonicalSyncStatus;
  githubView: ProjectGitHubActivity | null;
  githubViewError: ApiError | null;
  isGitHubViewLoading: boolean;
  retryGitHubView: () => Promise<void>;
  selectRepository: (linkedRepositoryId: string) => Promise<void>;
  loadActivityPage: (
    page: number,
  ) => Promise<PaginatedListResult<ProjectGitHubRecentCommit>>;
  loadContributorsPage: (
    page: number,
  ) => Promise<PaginatedListResult<ProjectGitHubContributor>>;
  loadPullRequestsPage: (
    page: number,
    options?: ProjectGitHubPullRequestPageOptions,
  ) => Promise<PaginatedListResult<ProjectGitHubPullRequest>>;
};

function toApiError(error: unknown, projectId: string): ApiError {
  if (isApiException(error)) {
    return error.apiError;
  }

  return {
    timestamp: new Date().toISOString(),
    status: 500,
    error: "Internal Server Error",
    code: "INTERNAL_ERROR",
    message: "Unable to load GitHub activity right now.",
    path: `${PROJECTS_BASE_PATH}/${projectId}/github`,
    traceId: null,
    details: [],
  };
}

export function useStudentProjectGitHubDashboard({
  projectId,
  githubRepositories,
  fetchDashboard,
  fetchActivityPage,
  fetchContributorsPage,
  fetchPullRequestsPage,
  reloadRepositories,
}: UseStudentProjectGitHubDashboardParams): UseStudentProjectGitHubDashboardResult {
  const [isRepoSelectorOpen, setRepoSelectorOpen] = useState(false);
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
  const [githubView, setGithubView] = useState<ProjectGitHubActivity | null>(
    null,
  );
  const [githubViewError, setGithubViewError] = useState<ApiError | null>(null);
  const [isGitHubViewLoading, setIsGitHubViewLoading] = useState(false);
  const dashboardRequestVersionRef = useRef(0);
  const syncRevisionRef = useRef<number | null>(null);

  const enabledRepositories = useMemo(
    () =>
      githubRepositories?.repositories?.filter(
        (repository) =>
          repository.enabled && repository.accessStatus === "AVAILABLE",
      ) ?? [],
    [githubRepositories?.repositories],
  );

  const activeRepository = useMemo(
    () =>
      enabledRepositories.find(
        (repository) => repository.id === selectedRepoId,
      ) ?? null,
    [enabledRepositories, selectedRepoId],
  );

  const activeRepositorySyncStatus = normalizeSyncStatus(
    activeRepository?.syncStatus,
  );

  const loadDashboard = useCallback(
    async (linkedRepositoryId: string, forceRefresh = false) => {
      if (!projectId) return null;

      const requestVersion = ++dashboardRequestVersionRef.current;
      setIsGitHubViewLoading(true);
      setGithubViewError(null);
      try {
        const nextView = await fetchDashboard(
          projectId,
          forceRefresh,
          linkedRepositoryId,
        );
        if (requestVersion === dashboardRequestVersionRef.current) {
          setGithubView(nextView);
        }
        return nextView;
      } catch (error) {
        if (requestVersion === dashboardRequestVersionRef.current) {
          setGithubViewError(toApiError(error, projectId));
        }
        return null;
      } finally {
        if (requestVersion === dashboardRequestVersionRef.current) {
          setIsGitHubViewLoading(false);
        }
      }
    },
    [fetchDashboard, projectId],
  );

  useEffect(() => {
    if (enabledRepositories.length === 0) {
      dashboardRequestVersionRef.current += 1;
      setSelectedRepoId(null);
      setGithubView(null);
      setGithubViewError(null);
      setRepoSelectorOpen(false);
      return;
    }

    setSelectedRepoId((current) => {
      if (
        current &&
        enabledRepositories.some((repository) => repository.id === current)
      ) {
        return current;
      }

      return (
        enabledRepositories.find((repository) => repository.primary)?.id ??
        enabledRepositories[0]?.id ??
        null
      );
    });
  }, [enabledRepositories]);

  useEffect(() => {
    if (!selectedRepoId) return;
    // Switching repositories should use the dashboard cache/in-flight dedupe.
    // Explicit retries are the paths that intentionally force a fresh request.
    void loadDashboard(selectedRepoId);
  }, [loadDashboard, selectedRepoId]);

  const passiveFreshnessCheck = useCallback(async () => {
    if (!projectId || !selectedRepoId) return;
    const state = await studentApi.getProjectGitHubSyncState(projectId);
    const selected = state.repositories.find(
      (repository) => repository.linkedRepositoryId === selectedRepoId,
    );
    if (!selected) return;
    const previous = syncRevisionRef.current;
    syncRevisionRef.current = selected.syncRevision;
    const serverStatus = normalizeSyncStatus(selected.syncStatus);
    const statusChanged = serverStatus !== activeRepositorySyncStatus;
    const revisionChanged =
      previous !== null && previous !== selected.syncRevision;
    if (statusChanged || revisionChanged) {
      await reloadRepositories();
    }
    if (revisionChanged) {
      await loadDashboard(selectedRepoId, true);
    }
  }, [
    activeRepositorySyncStatus,
    loadDashboard,
    projectId,
    reloadRepositories,
    selectedRepoId,
  ]);

  useEffect(() => {
    syncRevisionRef.current = null;
  }, [selectedRepoId]);

  usePageAwarePolling({
    enabled: Boolean(projectId && selectedRepoId),
    intervalMs:
      activeRepositorySyncStatus === "PENDING" ||
      activeRepositorySyncStatus === "IN_PROGRESS"
        ? 3_000
        : 30_000,
    run: passiveFreshnessCheck,
  });

  const selectRepository = useCallback(async (linkedRepositoryId: string) => {
    setSelectedRepoId(linkedRepositoryId);
    setRepoSelectorOpen(false);
  }, []);

  const retryGitHubView = useCallback(async () => {
    if (!selectedRepoId) return;
    await loadDashboard(selectedRepoId, true);
  }, [loadDashboard, selectedRepoId]);

  const loadActivityPage = useCallback(
    (page: number) => {
      if (!projectId || !selectedRepoId) {
        return Promise.resolve({ items: [], hasMore: false, page, size: 10 });
      }

      return fetchActivityPage(projectId, page, selectedRepoId);
    },
    [projectId, fetchActivityPage, selectedRepoId],
  );

  const loadContributorsPage = useCallback(
    (page: number) => {
      if (!projectId || !selectedRepoId) {
        return Promise.resolve({ items: [], hasMore: false, page, size: 10 });
      }

      return fetchContributorsPage(projectId, page, selectedRepoId);
    },
    [projectId, fetchContributorsPage, selectedRepoId],
  );

  const loadPullRequestsPage = useCallback(
    (page: number, options: ProjectGitHubPullRequestPageOptions = {}) => {
      if (!projectId || !selectedRepoId) {
        return Promise.resolve({
          items: [],
          hasMore: false,
          page,
          size: options.size ?? 10,
          total: 0,
        });
      }

      return fetchPullRequestsPage(projectId, page, selectedRepoId, options);
    },
    [fetchPullRequestsPage, projectId, selectedRepoId],
  );

  return {
    enabledRepositories,
    selectedRepoId,
    isRepoSelectorOpen,
    setRepoSelectorOpen,
    activeRepository,
    activeRepositorySyncStatus,
    githubView,
    githubViewError,
    isGitHubViewLoading,
    retryGitHubView,
    selectRepository,
    loadActivityPage,
    loadContributorsPage,
    loadPullRequestsPage,
  };
}
