import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupervisorDashboardApi } from "./supervisorDashboardApi";

vi.mock("@/app/config/apiVersion", () => ({
  toVersionedApiPath: (path: string) => `/api/v1${path.slice("/api".length)}`,
}));

describe("supervisorDashboardApi US-106", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("composes the Project dashboard with JiraService health", async () => {
    const dashboard = {
      totalProjects: 1,
      planningProjects: 0,
      activeProjects: 1,
      atRiskProjects: 0,
      behindProjects: 0,
      completedProjects: 0,
      upcomingMilestonesCount: 0,
      jiraAtRiskCount: 0,
      jiraBehindCount: 0,
      projects: [
        {
          id: "project-1",
          title: "Project",
          summary: null,
          lifecycleStatus: "ACTIVE",
          milestoneDate: null,
          lastActivityAt: null,
          progressPercent: 10,
          memberCount: 2,
          jiraHealthIndicator: "NOT_CONNECTED",
        },
      ],
      recentProjects: [],
    };
    const jira = {
      connectedCount: 1,
      atRiskCount: 1,
      behindCount: 0,
      projects: [
        {
          projectId: "project-1",
          connected: true,
          indicator: "AT_RISK",
          completionPercent: 50,
          openIssues: 3,
          overdueIssues: 1,
          highPriorityOpen: 0,
          syncStatus: "SYNCED",
          lastSyncedAt: "2026-10-04T00:00:00Z",
        },
      ],
    };
    const apiClient = {
      get: vi.fn().mockResolvedValue(dashboard),
      post: vi.fn().mockResolvedValue(jira),
    };
    const api = createSupervisorDashboardApi({ apiClient: apiClient as never });

    const result = await api.getDashboard();

    expect(result.jiraAtRiskCount).toBe(1);
    expect(result.jiraBehindCount).toBe(0);
    expect(result.jiraConnectedCount).toBe(1);
    expect(result.projects[0]?.jiraHealthIndicator).toBe("AT_RISK");
    expect(apiClient.get).toHaveBeenCalledWith("/api/v1/supervisor/dashboard");
    expect(apiClient.post).toHaveBeenCalledWith(
      "/api/v1/jira/dashboard/health",
      { projectIds: ["project-1"] },
    );
  });

  it("keeps the dashboard available and marks Jira unavailable when JiraService fails", async () => {
    const dashboard = {
      totalProjects: 1,
      planningProjects: 0,
      activeProjects: 1,
      atRiskProjects: 0,
      behindProjects: 0,
      completedProjects: 0,
      upcomingMilestonesCount: 0,
      jiraAtRiskCount: 0,
      jiraBehindCount: 0,
      projects: [
        {
          id: "project-1",
          title: "Project",
          summary: null,
          lifecycleStatus: "ACTIVE",
          milestoneDate: null,
          lastActivityAt: null,
          progressPercent: 10,
          memberCount: 2,
          jiraHealthIndicator: "NOT_CONNECTED",
        },
      ],
      recentProjects: [],
    };
    const apiClient = {
      get: vi.fn().mockResolvedValue(dashboard),
      post: vi.fn().mockRejectedValue(new Error("jira unavailable")),
    };
    const api = createSupervisorDashboardApi({ apiClient: apiClient as never });

    const result = await api.getDashboard();

    expect(result.jiraMetricsStatus).toBe("UNAVAILABLE");
    expect(result.projects[0]?.jiraHealthIndicator).toBe("UNAVAILABLE");
  });
});
