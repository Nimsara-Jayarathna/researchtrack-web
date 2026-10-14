import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { SupervisorDashboardProjectItem } from "../../types";
import { DashboardProjectHealthSection } from "./DashboardProjectHealthSection";
import { DashboardUpcomingMilestonesSection } from "./DashboardUpcomingMilestonesSection";
import { DashboardAttentionSection } from "./DashboardAttentionSection";

const project: SupervisorDashboardProjectItem = {
  id: "project-42",
  title: "Implementation",
  summary: "Track research work",
  lifecycleStatus: "BEHIND",
  milestoneDate: null,
  lastActivityAt: null,
  progressPercent: 100,
  memberCount: 2,
  jiraHealthIndicator: "HEALTHY",
};

describe("dashboard workspace refinement", () => {
  it("keeps status and reported progress separate, and exposes working lifecycle filtering", () => {
    const onFilter = vi.fn();
    render(
      <MemoryRouter>
        <DashboardProjectHealthSection
          isLoading={false}
          visibleProjects={[project]}
          pagedProjects={[project]}
          pageSize={5}
          safeCurrentPage={1}
          totalPages={1}
          hasAnyProjects
          hasSearchQuery={false}
          statusFilter="ALL"
          onStatusFilterChange={onFilter}
          pagingStateHandlers={{ setCurrentPage: vi.fn() }}
        />
      </MemoryRouter>,
    );
    expect(screen.getAllByText("BEHIND").length).toBeGreaterThan(0);
    expect(screen.getAllByText("100%").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Healthy").length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText("Lifecycle"), {
      target: { value: "BEHIND" },
    });
    expect(onFilter).toHaveBeenCalledWith("BEHIND");
    expect(
      screen.queryByRole("button", { name: "Previous" }),
    ).not.toBeInTheDocument();
  });

  it("differentiates no configured milestone from no approaching deadlines", () => {
    const { rerender } = render(
      <MemoryRouter>
        <DashboardUpcomingMilestonesSection
          isLoading={false}
          upcomingProjects={[]}
          hasConfiguredMilestones={false}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("No milestones configured")).toBeInTheDocument();
    rerender(
      <MemoryRouter>
        <DashboardUpcomingMilestonesSection
          isLoading={false}
          upcomingProjects={[]}
          hasConfiguredMilestones
        />
      </MemoryRouter>,
    );
    expect(
      screen.getByText("No deadlines in the next two weeks"),
    ).toBeInTheDocument();
  });

  it("provides a meaningful all-clear attention state", () => {
    render(
      <MemoryRouter>
        <DashboardAttentionSection isLoading={false} attentionProjects={[]} />
      </MemoryRouter>,
    );
    expect(screen.getByText("No urgent reviews right now")).toBeInTheDocument();
  });
});
