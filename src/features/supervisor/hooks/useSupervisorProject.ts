import { useEffect, useState } from "react";
import { isApiException } from "@/services/apiClient";
import type { ApiError } from "@/types";
import { supervisorApi } from "../api/supervisorApi";
import type { SupervisorProjectDetail } from "../types";

type SupervisorProjectState = {
  project: SupervisorProjectDetail | null;
  isLoading: boolean;
  error: ApiError | null;
};

export function useSupervisorProject(projectId: string | undefined) {
  const [state, setState] = useState<SupervisorProjectState>({
    project: null,
    isLoading: Boolean(projectId),
    error: null,
  });

  async function loadProject(forceRefresh = false) {
    if (!projectId) {
      setState({
        project: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    setState((current) => ({ ...current, isLoading: true, error: null }));

    try {
      const [baseProject, jiraConnection] = await Promise.all([
        supervisorApi.getProjectById(projectId, forceRefresh),
        supervisorApi.getJiraConnection(projectId),
      ]);
      const project = { ...baseProject, jira: jiraConnection ? {
        connected: true,
        workspaceName: jiraConnection.workspaceName,
        workspaceUrl: jiraConnection.workspaceUrl,
        lastSyncedAt: jiraConnection.lastSyncedAt,
        syncStatus: jiraConnection.syncStatus,
      } : null };
      setState({
        project,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState({
        project: null,
        isLoading: false,
        error: isApiException(error)
          ? error.apiError
          : {
              code: "INTERNAL_ERROR",
              message: "Unable to load the project right now.",
              details: [],
              timestamp: new Date().toISOString(),
              status: 0,
              error: "Unexpected Error",
              path: "",
              traceId: null,
            },
      });
    }
  }

  useEffect(() => {
    if (!projectId) {
      setState({
        project: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    let isCancelled = false;
    setState((current) => ({ ...current, isLoading: true, error: null }));

    void Promise.all([
      supervisorApi.getProjectById(projectId),
      supervisorApi.getJiraConnection(projectId),
    ])
      .then(([baseProject, jiraConnection]) => {
        const project = { ...baseProject, jira: jiraConnection ? {
          connected: true,
          workspaceName: jiraConnection.workspaceName,
          workspaceUrl: jiraConnection.workspaceUrl,
          lastSyncedAt: jiraConnection.lastSyncedAt,
          syncStatus: jiraConnection.syncStatus,
        } : null };
        if (isCancelled) {
          return;
        }

        setState({
          project,
          isLoading: false,
          error: null,
        });
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }

        setState({
          project: null,
          isLoading: false,
          error: isApiException(error)
            ? error.apiError
            : {
                code: "INTERNAL_ERROR",
                message: "Unable to load the project right now.",
                details: [],
                timestamp: new Date().toISOString(),
                status: 0,
                error: "Unexpected Error",
                path: "",
                traceId: null,
              },
        });
      });

    return () => {
      isCancelled = true;
    };
  }, [projectId]);

  return {
    project: state.project,
    isLoading: state.isLoading,
    error: state.error,
    reload: () => loadProject(true),
  };
}
