import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupervisorDashboard } from "../types";
import {
  getCachedSupervisorDashboard,
  invalidateSupervisorDashboardCache,
  setCachedSupervisorDashboard,
} from "../cache/supervisorDashboardCache";
import { createSupervisorProjectsApi } from "./supervisorProjectsApi";

const dashboard: SupervisorDashboard = {
  totalProjects: 1,
  planningProjects: 0,
  activeProjects: 1,
  atRiskProjects: 0,
  behindProjects: 0,
  completedProjects: 0,
  upcomingMilestonesCount: 0,
  jiraAtRiskCount: 0,
  jiraBehindCount: 0,
  projects: [],
  recentProjects: [],
};

describe("supervisorProjectsApi US-106 dashboard coherence", () => {
  beforeEach(() => {
    invalidateSupervisorDashboardCache();
    vi.clearAllMocks();
  });

  it("invalidates the dashboard aggregate after a project mutation", async () => {
    setCachedSupervisorDashboard(dashboard);

    const projectDetail = {
      id: "project-1",
      title: "Updated project",
      summary: "Updated summary",
      lifecycleStatus: "ACTIVE" as const,
      batch: "2026",
      semester: "Semester 1",
      milestoneDate: null,
      lastActivityAt: "2026-08-28T12:00:00Z",
      progressPercent: 50,
      supervisor: null,
      leader: null,
      members: [],
      milestones: [],
    };
    const apiClient = {
      put: vi.fn().mockResolvedValue(projectDetail),
    };
    const api = createSupervisorProjectsApi({
      apiClient: apiClient as never,
      cachedProjectsById: {},
      inFlightProjectRequests: {},
    });

    await api.updateProject("project-1", {
      title: "Updated project",
      summary: "Updated summary",
      batch: "2026",
      semester: "Semester 1",
      lifecycleStatus: "ACTIVE",
    });

    expect(getCachedSupervisorDashboard()).toBeNull();
  });
});
