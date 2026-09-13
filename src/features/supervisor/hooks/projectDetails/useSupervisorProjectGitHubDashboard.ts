import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { normalizeSyncStatus } from "@/lib/syncStatus";
import type { CanonicalSyncStatus } from "@/lib/syncStatus";
import type { ApiError } from "@/types";
import type {
  PaginatedListResult,
  ProjectGitHubContributor,
  ProjectGitHubRecentCommit,
} from "@/features/projects/types";
import type { ProjectRepositoryLink } from "@/features/shared/types/github.types";
import { supervisorApi } from "../../api/supervisorApi";
import type {
  ProjectGitHubActivity,
  ProjectGitHubRepositories,
} from "../../types";
import { isApiException } from "@/services/apiClient";

type RefreshModalControls = {
  showLoading: (payload: {
    title: string;
    message: string;
    retryAction?: () => void;
  }) => void;
  showSuccess: (payload: {
    title: string;
    message: string;
    redirectToJiraOnClose?: boolean;
  }) => void;
  showError: (payload: {
    title: string;
    message: string;
    retryAction?: () => void;
  }) => void;
};

type UseSupervisorProjectGitHubDashboardParams = {
  projectId: string | undefined;
  isActive: boolean;
  githubRepositories: ProjectGitHubRepositories | null | undefined;
  reloadRepositories: () => Promise<ProjectGitHubRepositories | null>;
  refreshModal: RefreshModalControls;
};

type UseSupervisorProjectGitHubDashboardResult = {
  enabledRepositories: ProjectRepositoryLink[];
  selectedRepoId: string | null;
  activeRepository: ProjectRepositoryLink | null;
  activeRepositorySyncStatus: CanonicalSyncStatus;
  githubView: ProjectGitHubActivity | null;
  githubViewError: ApiError | null;
  isGitHubViewLoading: boolean;
  isRefreshingGitHub: boolean;
  isRepoSelectorOpen: boolean;
  setIsRepoSelectorOpen: (open: boolean) => void;
  refreshGitHub: () => Promise<void>;
  retryGitHubView: () => Promise<void>;
  selectRepository: (linkedRepositoryId: string) => Promise<void>;
  loadActivityPage: (
    page: number,
  ) => Promise<PaginatedListResult<ProjectGitHubRecentCommit>>;
  loadContributorsPage: (
    page: number,
  ) => Promise<PaginatedListResult<ProjectGitHubContributor>>;
};

const SYNC_POLL_INTERVAL_MS = 3000;
const MAX_REFRESH_POLL_ATTEMPTS = 40;

function toApiError(error: unknown, projectId: string): ApiError {
  if (isApiException(error)) {
    return error.apiError;
  }

  return {
    timestamp: new Date().toISOString(),
    status: 500,
    error: "Internal Server Error",
    code: "GITHUB_DASHBOARD_LOAD_FAILED",
    message: "Unable to load GitHub activity right now.",
    path: `/api/supervisor/projects/${projectId}/github`,
    traceId: null,
    details: [],
  };
}

export function useSupervisorProjectGitHubDashboard({
  projectId,
  isActive,
  githubRepositories,
  reloadRepositories,
  refreshModal,
}: UseSupervisorProjectGitHubDashboardParams): UseSupervisorProjectGitHubDashboardResult {
  const { showLoading, showSuccess, showError } = refreshModal;
  const [isRefreshingGitHub, setIsRefreshingGitHub] = useState(false);
  const [isGitHubViewLoading, setIsGitHubViewLoading] = useState(false);
  const [githubViewError, setGithubViewError] = useState<ApiError | null>(null);
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
  const [githubView, setGithubView] = useState<ProjectGitHubActivity | null>(null);
  const [isRepoSelectorOpen, setIsRepoSelectorOpen] = useState(false);

  const dashboardRequestVersionRef = useRef(0);
  const refreshAwaitingCompletionRef = useRef(false);
  const refreshBaselineSyncedAtRef = useRef<string | null>(null);
  const refreshSawRunningRef = useRef(false);
  const refreshPollAttemptsRef = useRef(0);
  const lastTerminalSyncKeyRef = useRef<string | null>(null);

  const enabledRepositories = useMemo(
    () =>
      githubRepositories?.repositories?.filter(
        (repository) => repository.enabled,
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
    async (
      linkedRepositoryId: string,
      options: { forceRefresh?: boolean; showLoading?: boolean } = {},
    ) => {
      if (!projectId || !isActive) {
        return null;
      }

      const { forceRefresh = false, showLoading = true } = options;
      const requestVersion = ++dashboardRequestVersionRef.current;

      if (showLoading) {
        setIsGitHubViewLoading(true);
      }
      setGithubViewError(null);

      try {
        const nextView = await supervisorApi.getProjectGitHubDashboard(
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
        if (
          showLoading &&
          requestVersion === dashboardRequestVersionRef.current
        ) {
          setIsGitHubViewLoading(false);
        }
      }
    },
    [isActive, projectId],
  );

  // Keep an existing user selection when repository polling returns a new
  // array instance. Only choose the primary/first repository when the current
  // selection is missing or no longer enabled.
  useEffect(() => {
    if (!isActive) return;

    if (enabledRepositories.length === 0) {
      setSelectedRepoId(null);
      setGithubView(null);
      setGithubViewError(null);
      setIsRepoSelectorOpen(false);
      dashboardRequestVersionRef.current += 1;
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
  }, [enabledRepositories, isActive]);

  // The dedicated GitHub dashboard endpoint is authoritative for the GitHub
  // tab. Load it lazily once a repository is selected instead of inheriting a
  // potentially stale snapshot from the project details response.
  useEffect(() => {
    if (!isActive || !selectedRepoId) return;
    void loadDashboard(selectedRepoId, { forceRefresh: true });
  }, [isActive, loadDashboard, selectedRepoId]);

  // One polling owner only. It handles both background/initial syncs and a
  // supervisor-triggered refresh. A manual refresh can briefly remain SUCCESS
  // before the queued worker marks it PENDING, so we also compare the sync
  // timestamp and remember whether a running state was observed.
  useEffect(() => {
    if (!projectId || !isActive || !selectedRepoId) return;

    const statusIsRunning =
      activeRepositorySyncStatus === "IN_PROGRESS" ||
      activeRepositorySyncStatus === "PENDING";
    if (!statusIsRunning && !refreshAwaitingCompletionRef.current) {
      return;
    }

    let cancelled = false;
    let timeoutId: number | null = null;

    const scheduleNextPoll = () => {
      timeoutId = window.setTimeout(poll, SYNC_POLL_INTERVAL_MS);
    };

    const finishWithLatestDashboard = async (
      latestRepository: ProjectRepositoryLink | null,
      latestStatus: CanonicalSyncStatus,
    ) => {
      const terminalKey = `${selectedRepoId}:${latestStatus}:${latestRepository?.lastSyncedAt ?? ""}`;
      if (lastTerminalSyncKeyRef.current !== terminalKey) {
        lastTerminalSyncKeyRef.current = terminalKey;
        await loadDashboard(selectedRepoId, {
          forceRefresh: true,
          showLoading: false,
        });
      }
    };

    const poll = async () => {
      const latestRepositories = await reloadRepositories();
      if (cancelled) return;

      const latestRepository =
        latestRepositories?.repositories?.find(
          (repository) => repository.id === selectedRepoId,
        ) ?? null;
      const latestStatus = normalizeSyncStatus(latestRepository?.syncStatus);
      const latestIsRunning =
        latestStatus === "PENDING" || latestStatus === "IN_PROGRESS";

      if (latestIsRunning) {
        refreshSawRunningRef.current = true;
        refreshPollAttemptsRef.current += 1;
        scheduleNextPoll();
        return;
      }

      if (refreshAwaitingCompletionRef.current) {
        refreshPollAttemptsRef.current += 1;
        const baselineSyncedAt = refreshBaselineSyncedAtRef.current;
        const syncTimestampAdvanced =
          Boolean(latestRepository?.lastSyncedAt) &&
          latestRepository?.lastSyncedAt !== baselineSyncedAt;
        const refreshCompleted =
          latestStatus === "FAILED" ||
          (latestStatus === "SUCCESS" &&
            (refreshSawRunningRef.current || syncTimestampAdvanced));

        if (!refreshCompleted) {
          if (refreshPollAttemptsRef.current < MAX_REFRESH_POLL_ATTEMPTS) {
            scheduleNextPoll();
            return;
          }

          refreshAwaitingCompletionRef.current = false;
          showSuccess({
            title: "GitHub refresh is still processing",
            message:
              "The refresh was accepted but has not reported completion yet. You can keep using the page; the next visit will load the latest synchronized data.",
          });
          return;
        }

        refreshAwaitingCompletionRef.current = false;
        await finishWithLatestDashboard(latestRepository, latestStatus);

        if (latestStatus === "SUCCESS") {
          showSuccess({
            title: "GitHub data refreshed",
            message: "Latest repository activity is now up to date.",
          });
        } else {
          showError({
            title: "GitHub sync failed",
            message:
              "Repository synchronization failed. You can retry the refresh.",
          });
        }
        return;
      }

      // Background/initial sync reached a terminal state. Refresh the dashboard
      // once so newly persisted commits and contributors become visible.
      await finishWithLatestDashboard(latestRepository, latestStatus);
    };

    scheduleNextPoll();

    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [
    activeRepositorySyncStatus,
    isActive,
    loadDashboard,
    projectId,
    reloadRepositories,
    selectedRepoId,
    showError,
    showSuccess,
  ]);

  const selectRepository = useCallback(
    async (linkedRepositoryId: string) => {
      setSelectedRepoId(linkedRepositoryId);
      setIsRepoSelectorOpen(false);
      // The selection effect will load the dashboard. Avoid starting a second
      // identical request here.
    },
    [],
  );

  const retryGitHubView = useCallback(async () => {
    if (!selectedRepoId) {
      await reloadRepositories();
      return;
    }
    await loadDashboard(selectedRepoId, { forceRefresh: true });
  }, [loadDashboard, reloadRepositories, selectedRepoId]);

  const loadActivityPage = useCallback(
    (page: number) => {
      if (!projectId || !selectedRepoId) {
        return Promise.resolve({ items: [], hasMore: false, page, size: 10 });
      }
      return supervisorApi.getProjectGitHubActivityPage(
        projectId,
        page,
        selectedRepoId,
      );
    },
    [projectId, selectedRepoId],
  );

  const loadContributorsPage = useCallback(
    (page: number) => {
      if (!projectId || !selectedRepoId) {
        return Promise.resolve({ items: [], hasMore: false, page, size: 10 });
      }
      return supervisorApi.getProjectGitHubContributorsPage(
        projectId,
        page,
        selectedRepoId,
      );
    },
    [projectId, selectedRepoId],
  );

  const refreshGitHub = useCallback(async () => {
    if (!projectId || !selectedRepoId) {
      return;
    }

    setIsRefreshingGitHub(true);
    showLoading({
      title: "Starting GitHub refresh",
      message: "Queueing synchronization for the active repository.",
      retryAction: () => void refreshGitHub(),
    });

    try {
      refreshBaselineSyncedAtRef.current = activeRepository?.lastSyncedAt ?? null;
      refreshSawRunningRef.current = false;
      refreshPollAttemptsRef.current = 0;
      refreshAwaitingCompletionRef.current = true;
      lastTerminalSyncKeyRef.current = null;

      await supervisorApi.refreshGitHubRepository(projectId, selectedRepoId);
      await reloadRepositories();

      showSuccess({
        title: "GitHub refresh started",
        message:
          "The active repository is syncing. This page will update automatically when synchronization finishes.",
      });
    } catch (error) {
      refreshAwaitingCompletionRef.current = false;
      const message = isApiException(error)
        ? error.apiError.message
        : "Unable to refresh GitHub data right now. Please try again.";
      showError({
        title: "GitHub refresh failed",
        message,
        retryAction: () => void refreshGitHub(),
      });
    } finally {
      setIsRefreshingGitHub(false);
    }
  }, [
    activeRepository?.lastSyncedAt,
    projectId,
    reloadRepositories,
    selectedRepoId,
    showError,
    showLoading,
    showSuccess,
  ]);

  return {
    enabledRepositories,
    selectedRepoId,
    activeRepository,
    activeRepositorySyncStatus,
    githubView,
    githubViewError,
    isGitHubViewLoading,
    isRefreshingGitHub,
    isRepoSelectorOpen,
    setIsRepoSelectorOpen,
    refreshGitHub,
    retryGitHubView,
    selectRepository,
    loadActivityPage,
    loadContributorsPage,
  };
}
