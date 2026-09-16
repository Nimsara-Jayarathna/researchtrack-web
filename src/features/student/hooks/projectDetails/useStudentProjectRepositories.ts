import { useCallback, useEffect, useRef, useState } from "react";
import { toVersionedApiPath } from "@/app/config/apiVersion";
import type { ApiError } from "@/types";
import { isApiException } from "@/services/apiClient";
import type { ProjectGitHubRepositories } from "@/features/shared/types/github.types";
import { studentApi } from "../../api/studentApi";

const PROJECTS_BASE_PATH = toVersionedApiPath("/api/projects");

type UseStudentProjectRepositoriesOptions = {
  enabled?: boolean;
};

export type UseStudentProjectRepositoriesState = {
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
    message: "Unable to load the linked GitHub repositories right now.",
    path: `${PROJECTS_BASE_PATH}/${projectId}/github-repositories`,
    traceId: null,
    details: [],
  };
}

export function useStudentProjectRepositories(
  projectId: string | undefined,
  initialData: ProjectGitHubRepositories | null | undefined,
  options: UseStudentProjectRepositoriesOptions = {},
): UseStudentProjectRepositoriesState {
  const { enabled = true } = options;
  const [data, setData] = useState<ProjectGitHubRepositories | null>(
    initialData ?? null,
  );
  const [isLoading, setIsLoading] = useState(
    Boolean(enabled && projectId && !initialData),
  );
  const [error, setError] = useState<ApiError | null>(null);
  const requestVersionRef = useRef(0);

  const runFetch = useCallback(async () => {
    if (!projectId || !enabled) return null;

    const requestVersion = ++requestVersionRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const next = await studentApi.getProjectGitHubRepositories(projectId);
      if (requestVersion === requestVersionRef.current) {
        setData(next);
      }
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
      if (requestVersion === requestVersionRef.current) {
        setIsLoading(false);
      }
    }
  }, [enabled, projectId]);

  const reload = useCallback(() => runFetch(), [runFetch]);

  useEffect(() => {
    requestVersionRef.current += 1;

    if (!projectId) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (initialData?.projectId === projectId) {
      setData(initialData);
      setError(null);
      setIsLoading(false);
      return;
    }

    setData(null);
    setError(null);

    if (!enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    void runFetch();
  }, [enabled, initialData, projectId, runFetch]);

  return { data, isLoading, error, reload };
}
