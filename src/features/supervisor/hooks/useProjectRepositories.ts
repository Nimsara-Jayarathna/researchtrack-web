import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiError } from "@/types";
import { isApiException } from "@/services/apiClient";
import { supervisorApi } from "../api/supervisorApi";
import type { ProjectGitHubRepositories } from "../types";

type UseProjectRepositoriesOptions = {
  enabled?: boolean;
};

type UseProjectRepositoriesState = {
  data: ProjectGitHubRepositories | null;
  isLoading: boolean;
  error: ApiError | null;
  reload: () => Promise<ProjectGitHubRepositories | null>;
};

export function useProjectRepositories(
  projectId: string | undefined,
  options: UseProjectRepositoriesOptions = {},
): UseProjectRepositoriesState {
  const { enabled = true } = options;
  const [data, setData] = useState<ProjectGitHubRepositories | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const requestVersionRef = useRef(0);

  const reload = useCallback(async () => {
    if (!projectId || !enabled) {
      setIsLoading(false);
      if (!projectId) {
        setData(null);
        setError(null);
      }
      return null;
    }

    const requestVersion = ++requestVersionRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const next = await supervisorApi.getProjectGitHubRepositories(projectId);
      if (requestVersion === requestVersionRef.current) {
        setData(next);
      }
      return next;
    } catch (loadError) {
      if (requestVersion === requestVersionRef.current) {
        // Keep the last known repository snapshot on a transient reload failure.
        // This avoids briefly showing "No repository connected" while a refresh
        // or status poll is failing.
        setError(
          isApiException(loadError)
            ? loadError.apiError
            : {
                timestamp: new Date().toISOString(),
                status: 500,
                error: "Internal Server Error",
                code: "INTERNAL_ERROR",
                message: "Unable to load project repositories right now.",
                path: `/api/projects/${projectId}/github-repositories`,
                traceId: null,
                details: [],
              },
        );
      }
      return null;
    } finally {
      if (requestVersion === requestVersionRef.current) {
        setIsLoading(false);
      }
    }
  }, [enabled, projectId]);

  useEffect(() => {
    if (!enabled) {
      requestVersionRef.current += 1;
      setIsLoading(false);
      return;
    }

    void reload();
  }, [enabled, reload]);

  return { data, isLoading, error, reload };
}
