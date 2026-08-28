import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupervisorDashboardApi } from "./supervisorDashboardApi";

vi.mock("@/app/config/apiVersion", () => ({
  toVersionedApiPath: (path: string) => `/api/v1${path.slice("/api".length)}`,
}));

describe("supervisorDashboardApi US-106", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads the dedicated versioned Supervisor dashboard aggregate", async () => {
    const dashboard = {
      totalProjects: 0,
      planningProjects: 0,
      activeProjects: 0,
      atRiskProjects: 0,
      behindProjects: 0,
      completedProjects: 0,
      upcomingMilestonesCount: 0,
      jiraAtRiskCount: 0,
      jiraBehindCount: 0,
      projects: [],
      recentProjects: [],
    };
    const apiClient = { get: vi.fn().mockResolvedValue(dashboard) };
    const api = createSupervisorDashboardApi({ apiClient: apiClient as never });

    await expect(api.getDashboard()).resolves.toEqual(dashboard);

    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/v1/supervisor/dashboard",
    );
  });
});
