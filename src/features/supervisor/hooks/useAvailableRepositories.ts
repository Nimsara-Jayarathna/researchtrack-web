import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiError } from "@/types";
import { isApiException } from "@/services/apiClient";
import {
  getAvailableGitHubRepositoriesCacheSnapshot,
  subscribeAvailableGitHubRepositories,
} from "../cache/githubIntegrationCache";
import { supervisorApi } from "../api/supervisorApi";
import type { GitHubAvailableRepositories } from "../types";

type UseAvailableRepositoriesState = {
  data: GitHubAvailableRepositories | null;
  isLoading: boolean;
  error: ApiError | null;
  reload: () => Promise<void>;
};

export function useAvailableRepositories(
  sourceId: string | null,
): UseAvailableRepositoriesState {
  const initialSnapshot = sourceId
    ? getAvailableGitHubRepositoriesCacheSnapshot(sourceId)
    : null;
  const [data, setData] = useState<GitHubAvailableRepositories | null>(
    initialSnapshot?.data ?? null,
  );
  const [isLoading, setIsLoading] = useState(Boolean(sourceId && !initialSnapshot));
  const [error, setError] = useState<ApiError | null>(null);
  const requestVersionRef = useRef(0);

  const fetchRepositories = useCallback(
    async (forceRefresh: boolean) => {
      if (!sourceId) return;
      const requestVersion = ++requestVersionRef.current;
      const cached = getAvailableGitHubRepositoriesCacheSnapshot(sourceId);
      if (cached?.data) setData(cached.data);
      setIsLoading(!cached?.data || forceRefresh);
      setError(null);

      try {
        const next = await supervisorApi.getAvailableGitHubRepositories(sourceId, {
          forceRefresh,
        });
        if (requestVersion === requestVersionRef.current) setData(next);
      } catch (loadError) {
        if (requestVersion === requestVersionRef.current) {
          setError(
            isApiException(loadError)
              ? loadError.apiError
              : {
                  timestamp: new Date().toISOString(),
                  status: 500,
                  error: "Internal Server Error",
                  code: "INTERNAL_ERROR",
                  message: "Unable to load available repositories right now.",
                  path: "/api/github/repositories/available",
                  traceId: null,
                  details: [],
                },
          );
        }
      } finally {
        if (requestVersion === requestVersionRef.current) setIsLoading(false);
      }
    },
    [sourceId],
  );

  const reload = useCallback(async () => {
    await fetchRepositories(true);
  }, [fetchRepositories]);

  useEffect(() => {
    // Prevent an older source request from replacing state after the picker
    // switches to a different installation source.
    requestVersionRef.current += 1;
    if (!sourceId) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeAvailableGitHubRepositories(sourceId, (next) => {
      setData(next);
      setError(null);
    });
    const cached = getAvailableGitHubRepositoriesCacheSnapshot(sourceId);
    setData(cached?.data ?? null);
    if (cached?.isFresh) {
      setIsLoading(false);
    } else {
      setIsLoading(!cached?.data);
      void fetchRepositories(false);
    }
    return unsubscribe;
  }, [fetchRepositories, sourceId]);

  return { data, isLoading, error, reload };
}
