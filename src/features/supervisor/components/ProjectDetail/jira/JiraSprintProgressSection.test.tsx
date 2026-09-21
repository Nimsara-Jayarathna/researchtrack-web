import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { JiraSprintProgress } from "../../../types";
import { JiraSprintProgressSection } from "./JiraSprintProgressSection";

const ACTIVE: JiraSprintProgress = {
  hasActiveSprint: true,
  activeSprint: {
    sprintId: 12,
    sprintName: "Sprint 12",
    sprintState: "active",
    goal: "Finish Jira progress visibility",
    startDate: "2026-09-17T00:00:00Z",
    endDate: "2026-10-01T00:00:00Z",
    completeDate: null,
    statusBreakdown: { toDo: 5, inProgress: 3, done: 7 },
    issuesTotal: 15,
    issuesDone: 7,
    issuesRemaining: 8,
    completionPercent: 47,
    sprintPointsAvailable: true,
    sprintPointsTotal: 34,
    sprintPointsDone: 16,
  },
  sprints: [],
  summary: { total: 1, active: 1, future: 0, closed: 0 },
  sync: {
    status: "SYNCED",
    lastSyncedAt: "2026-09-20T08:00:00Z",
    lastSyncError: null,
  },
};
ACTIVE.sprints = ACTIVE.activeSprint ? [ACTIVE.activeSprint] : [];

describe("JiraSprintProgressSection", () => {
  it("renders current synchronized sprint progress", async () => {
    render(
      <JiraSprintProgressSection
        projectId="project-1"
        fetcher={vi.fn().mockResolvedValue(ACTIVE)}
      />,
    );
    expect(await screen.findByText("Sprint 12")).toBeInTheDocument();
    expect(screen.getAllByText("47%")).toHaveLength(2);
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("shows a no-active-sprint state without treating it as an error", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ...ACTIVE,
      hasActiveSprint: false,
      activeSprint: null,
      sprints: [],
      summary: { total: 0, active: 0, future: 0, closed: 0 },
    });
    render(
      <JiraSprintProgressSection projectId="project-1" fetcher={fetcher} />,
    );
    expect(
      await screen.findByText("No Jira sprints synchronized"),
    ).toBeInTheDocument();
  });
});
