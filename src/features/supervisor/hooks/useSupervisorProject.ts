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
        // Core project data and optional integration metadata are independent,
        // so start them together. A Jira failure must not block the project.
        const [baseProject, jiraResult] = await Promise.all([
          supervisorApi.getProjectById(projectId, forceRefresh),
          supervisorApi
            .getJiraConnection(projectId)
            .then((connection) => ({ connection }))
            .catch(() => ({ connection: null })),
        ]);

        let jira: SupervisorProjectDetail["jira"] = null;
        const connection = jiraResult.connection;
        if (connection) {
          jira = {
            connected: true,
            workspaceName: connection.workspaceName,
            workspaceUrl: connection.workspaceUrl,
            lastSyncedAt: connection.lastSyncedAt,
            syncStatus: connection.syncStatus,
            webhookStatus: connection.webhookStatus,
            lastWebhookAt: connection.lastWebhookAt,
            lastReconciledAt: connection.lastReconciledAt,
          };
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

  const invalidatePendingRequests = useCallback(() => {
    ++requestVersion.current;
  }, []);

  useEffect(() => {
    void loadProject();
    return invalidatePendingRequests;
  }, [invalidatePendingRequests, loadProject]);

  return {
    project: state.project,
    isLoading: state.isLoading,
    error: state.error,
    reload: () => loadProject(true),
  };
}
