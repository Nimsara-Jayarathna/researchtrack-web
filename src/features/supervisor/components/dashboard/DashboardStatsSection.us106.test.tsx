import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SupervisorDashboard } from "../../types";
import { DashboardStatsSection } from "./DashboardStatsSection";

const dashboard: SupervisorDashboard = {
  totalProjects: 1,
  planningProjects: 0,
  activeProjects: 1,
  atRiskProjects: 0,
  behindProjects: 0,
  completedProjects: 0,
  upcomingMilestonesCount: 1,
  jiraAtRiskCount: 0,
  jiraBehindCount: 0,
  projects: [
    {
      id: "project-1",
      title: "Research Project",
      summary: "Summary",
      lifecycleStatus: "ACTIVE",
      milestoneDate: "2026-09-05",
      lastActivityAt: "2026-08-28T12:00:00Z",
      progressPercent: 40,
      memberCount: 3,
      jiraHealthIndicator: "NOT_CONNECTED",
    },
  ],
  recentProjects: [],
};

describe("DashboardStatsSection US-106", () => {
  it("does not present zero Jira risk counts as real activity when Jira is not connected", () => {
    render(<DashboardStatsSection dashboard={dashboard} isLoading={false} />);

    expect(screen.getAllByText("Not linked")).toHaveLength(2);
  });
});
