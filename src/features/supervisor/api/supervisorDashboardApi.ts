import { toVersionedApiPath } from "@/app/config/apiVersion";
import type {
  SupervisorDashboard,
  SupervisorDashboardJiraHealth,
  SupervisorDashboardProjectItem,
} from "../types";

type ApiClient = typeof import("@/services/apiClient").apiClient;

type CreateSupervisorDashboardApiDeps = {
  apiClient: ApiClient;
};

function applyJiraHealth(
  project: SupervisorDashboardProjectItem,
  jiraByProjectId: Map<
    string,
    SupervisorDashboardJiraHealth["projects"][number]
  >,
): SupervisorDashboardProjectItem {
  const jira = jiraByProjectId.get(project.id);
  return {
    ...project,
    jiraHealthIndicator: jira?.indicator ?? "UNAVAILABLE",
  };
}

export function createSupervisorDashboardApi({
  apiClient,
}: CreateSupervisorDashboardApiDeps) {
  return {
    async getDashboard(): Promise<SupervisorDashboard> {
      const dashboard = await apiClient.get<SupervisorDashboard>(
        toVersionedApiPath("/api/supervisor/dashboard"),
      );

      if (dashboard.projects.length === 0) {
        return {
          ...dashboard,
          jiraConnectedCount: 0,
          jiraMetricsStatus: "READY",
        };
      }

      try {
        // ProjectService owns the core project dashboard while JiraService owns
        // Jira connection/issue truth. Compose the two read models here instead
        // of trusting the legacy ProjectService Jira placeholders.
        const jira = await apiClient.post<SupervisorDashboardJiraHealth>(
          "/api/v1/jira/dashboard/health",
          { projectIds: dashboard.projects.map((project) => project.id) },
        );
        const jiraByProjectId = new Map(
          jira.projects.map((project) => [project.projectId, project] as const),
        );

        return {
          ...dashboard,
          jiraAtRiskCount: jira.atRiskCount,
          jiraBehindCount: jira.behindCount,
          jiraConnectedCount: jira.connectedCount,
          jiraMetricsStatus: "READY",
          projects: dashboard.projects.map((project) =>
            applyJiraHealth(project, jiraByProjectId),
          ),
          recentProjects: dashboard.recentProjects.map((project) =>
            applyJiraHealth(project, jiraByProjectId),
          ),
        };
      } catch {
        // A Jira outage must not take down the Supervisor dashboard, but it also
        // must not be misrepresented as "Not linked". Mark Jira metrics as
        // unavailable until the next refresh.
        return {
          ...dashboard,
          jiraAtRiskCount: 0,
          jiraBehindCount: 0,
          jiraConnectedCount: 0,
          jiraMetricsStatus: "UNAVAILABLE",
          projects: dashboard.projects.map((project) => ({
            ...project,
            jiraHealthIndicator: "UNAVAILABLE",
          })),
          recentProjects: dashboard.recentProjects.map((project) => ({
            ...project,
            jiraHealthIndicator: "UNAVAILABLE",
          })),
        };
      }
    },
  };
}
