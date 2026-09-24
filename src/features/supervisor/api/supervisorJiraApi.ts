import type { createRoleProjectApi } from "@/features/shared/api/createRoleProjectApi";
import type {
  JiraAuthUrl,
  JiraBoardListResult,
  JiraConnection,
  JiraHealth,
  JiraLinkPayload,
  JiraOAuthCompletePayload,
  JiraOAuthCompleteResult,
} from "../types";
type RoleProjectApi = Omit<
  ReturnType<typeof createRoleProjectApi>,
  "clearCache"
>;
type ApiClient = typeof import("@/services/apiClient").apiClient;
type CreateSupervisorJiraApiDeps = {
  apiClient: ApiClient;
  roleProjectApi: RoleProjectApi;
};
export function createSupervisorJiraApi({
  apiClient,
  roleProjectApi,
}: CreateSupervisorJiraApiDeps) {
  return {
    getProjectJiraAuthUrl(projectId: string): Promise<JiraAuthUrl> {
      return apiClient.get<JiraAuthUrl>(
        `/api/v1/projects/${projectId}/jira/auth-url`,
      );
    },
    completeJiraOAuth(
      payload: JiraOAuthCompletePayload,
    ): Promise<JiraOAuthCompleteResult> {
      return apiClient.post<JiraOAuthCompleteResult>(
        "/api/v1/jira/oauth/complete",
        payload,
      );
    },
    getJiraConnection(projectId: string): Promise<JiraConnection | null> {
      return apiClient.get<JiraConnection | null>(
        `/api/v1/projects/${projectId}/jira/connection`,
      );
    },
    getJiraBoards(
      projectId: string,
      selectionToken: string,
      jiraProjectId: string,
    ): Promise<JiraBoardListResult> {
      const q = new URLSearchParams({ selectionToken, jiraProjectId });
      return apiClient.get<JiraBoardListResult>(
        `/api/v1/projects/${projectId}/jira/boards?${q.toString()}`,
      );
    },
    linkJiraProject(
      projectId: string,
      payload: JiraLinkPayload,
    ): Promise<JiraConnection> {
      return apiClient.post<JiraConnection>(
        `/api/v1/projects/${projectId}/jira/link`,
        payload,
      );
    },
    disconnectProjectJira(
      projectId: string,
    ): Promise<{ disconnected: boolean }> {
      return apiClient.post<{ disconnected: boolean }>(
        `/api/v1/projects/${projectId}/jira/disconnect`,
        {},
      );
    },
    async refreshProjectJira(projectId: string): Promise<JiraHealth> {
      const fresh = await apiClient.post<JiraHealth>(
        `/api/v1/projects/${projectId}/jira/refresh`,
        {},
      );
      roleProjectApi.invalidateJiraCache(projectId);
      roleProjectApi.primeJiraHealth(projectId, fresh);
      return fresh;
    },
  };
}
