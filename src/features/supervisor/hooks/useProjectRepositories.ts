import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiError } from "@/types";
import { isApiException } from "@/services/apiClient";
import {
  getProjectGitHubRepositoriesCacheSnapshot,
  subscribeProjectGitHubRepositories,
} from "../cache/githubIntegrationCache";
import { supervisorApi } from "../api/supervisorApi";
import type { ProjectGitHubRepositories } from "../types";

type UseProjectRepositoriesOptions = {
  enabled?: boolean;
};

export type UseProjectRepositoriesState = {
  data: ProjectGitHubRepositories | null;
  isLoading: boolean;
  error: ApiError | null;
  reload: () => Promise<ProjectGitHubRepositories | null>;
};

function fallbackError(projectId: string): ApiError {
  return {
    timestamp: new Date().toISOString(),
    status: 500,
    error: "Internal Server Error",
    code: "INTERNAL_ERROR",
    message: "Unable to load project repositories right now.",
    path: `/api/projects/${projectId}/github-repositories`,
    traceId: null,
    details: [],
  };
}

export function useProjectRepositories(
  projectId: string | undefined,
  options: UseProjectRepositoriesOptions = {},
): UseProjectRepositoriesState {
  const { enabled = true } = options;
  const initialSnapshot = projectId
    ? getProjectGitHubRepositoriesCacheSnapshot(projectId)
    : null;
  const [data, setData] = useState<ProjectGitHubRepositories | null>(
    initialSnapshot?.data ?? null,
  );
  const [isLoading, setIsLoading] = useState(
    Boolean(enabled && projectId && !initialSnapshot?.data),
  );
  const [error, setError] = useState<ApiError | null>(null);
  const requestVersionRef = useRef(0);

  const runFetch = useCallback(
    async (forceRefresh: boolean) => {
      if (!projectId || !enabled) return null;

      const requestVersion = ++requestVersionRef.current;
      const existing = getProjectGitHubRepositoriesCacheSnapshot(projectId);
      if (existing?.data) setData(existing.data);
      setIsLoading(!existing?.data);
      setError(null);

      try {
        const next = await supervisorApi.getProjectGitHubRepositories(
          projectId,
          {
            forceRefresh,
          },
        );
        if (requestVersion === requestVersionRef.current) setData(next);
        return next;
      } catch (loadError) {
        if (requestVersion === requestVersionRef.current) {
          setError(
            isApiException(loadError)
              ? loadError.apiError
              : fallbackError(projectId),
          );
        }
        return null;
      } finally {
        if (requestVersion === requestVersionRef.current) setIsLoading(false);
      }
    },
    [enabled, projectId],
  );

  const reload = useCallback(() => runFetch(true), [runFetch]);

  useEffect(() => {
    // Invalidate completions from the previous project/enabled state before
    // deciding whether this render needs a new request.
    requestVersionRef.current += 1;
    if (!projectId) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeProjectGitHubRepositories(
      projectId,
      (next) => {
        setData(next);
        setError(null);
      },
    );

    const cached = getProjectGitHubRepositoriesCacheSnapshot(projectId);
    setData(cached?.data ?? null);

    if (!enabled) {
      setIsLoading(false);
      return unsubscribe;
    }

    if (cached?.isFresh) {
      setIsLoading(false);
    } else {
      // Stale-while-revalidate: keep the last snapshot visible while one
      // deduplicated background request refreshes the shared project cache.
      setIsLoading(!cached?.data);
      void runFetch(false);
    }

    return unsubscribe;
  }, [enabled, projectId, runFetch]);

  return { data, isLoading, error, reload };
}
