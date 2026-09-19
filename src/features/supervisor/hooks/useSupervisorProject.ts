import { useCallback, useEffect, useRef, useState } from "react";
import { isApiException } from "@/services/apiClient";
import type { ApiError } from "@/types";
import { supervisorApi } from "../api/supervisorApi";
import type { SupervisorProjectDetail } from "../types";

type SupervisorProjectState = {
  project: SupervisorProjectDetail | null;
  isLoading: boolean;
  error: ApiError | null;
};

function unexpectedLoadError(): ApiError {
  return {
    code: "INTERNAL_ERROR",
    message: "Unable to load the project right now.",
    details: [],
    timestamp: new Date().toISOString(),
    status: 0,
    error: "Unexpected Error",
    path: "",
    traceId: null,
  };
}

export function useSupervisorProject(projectId: string | undefined) {
  const [state, setState] = useState<SupervisorProjectState>({
    project: null,
    isLoading: Boolean(projectId),
    error: null,
  });
  const requestVersion = useRef(0);

  const loadProject = useCallback(
    async (forceRefresh = false) => {
      const version = ++requestVersion.current;

      if (!projectId) {
        setState({ project: null, isLoading: false, error: null });
        return;
      }

      setState((current) => ({ ...current, isLoading: true, error: null }));

      try {
        // The project is essential. Jira is optional integration state, so a
        // temporary Jira failure must not make the whole project page fail.
        const baseProject = await supervisorApi.getProjectById(
          projectId,
          forceRefresh,
        );

        let jira: SupervisorProjectDetail["jira"] = null;
        try {
          const connection = await supervisorApi.getJiraConnection(projectId);
          if (connection) {
            jira = {
              connected: true,
              workspaceName: connection.workspaceName,
              workspaceUrl: connection.workspaceUrl,
              lastSyncedAt: connection.lastSyncedAt,
              syncStatus: connection.syncStatus,
            };
          }
        } catch {
          // Keep the base project usable. Jira-specific actions can retry their
          // own requests and surface integration errors independently.
        }

        if (version !== requestVersion.current) return;

        setState({
          project: { ...baseProject, jira },
          isLoading: false,
          error: null,
        });
      } catch (error) {
        if (version !== requestVersion.current) return;

        setState({
          project: null,
          isLoading: false,
          error: isApiException(error) ? error.apiError : unexpectedLoadError(),
        });
      }
    },
    [projectId],
  );

  useEffect(() => {
    void loadProject();
    return () => {
      ++requestVersion.current;
    };
  }, [loadProject]);

  return {
    project: state.project,
    isLoading: state.isLoading,
    error: state.error,
    reload: () => loadProject(true),
  };
}
