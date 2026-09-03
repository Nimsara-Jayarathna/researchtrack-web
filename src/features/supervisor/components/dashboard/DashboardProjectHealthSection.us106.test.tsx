import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { SupervisorDashboardProjectItem } from "../../types";
import { DashboardProjectHealthSection } from "./DashboardProjectHealthSection";

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

const project: SupervisorDashboardProjectItem = {
  id: "project-1",
  title: "Research Project",
  summary: "Summary",
  lifecycleStatus: "ACTIVE",
  milestoneDate: "2026-09-10",
  lastActivityAt: "2026-08-28T12:00:00Z",
  progressPercent: 40,
  memberCount: 4,
  jiraHealthIndicator: "NOT_CONNECTED",
};

function renderSection(options?: {
  projects?: SupervisorDashboardProjectItem[];
  hasAnyProjects?: boolean;
  hasSearchQuery?: boolean;
}) {
  const projects = options?.projects ?? [];
  return render(
    <MemoryRouter initialEntries={["/supervisor/dashboard"]}>
      <DashboardProjectHealthSection
        isLoading={false}
        visibleProjects={projects}
        pagedProjects={projects}
        pageSize={5}
        safeCurrentPage={1}
        totalPages={1}
        hasAnyProjects={options?.hasAnyProjects ?? projects.length > 0}
        hasSearchQuery={options?.hasSearchQuery ?? false}
        pagingStateHandlers={{ setCurrentPage: () => {} }}
      />
      <LocationProbe />
    </MemoryRouter>,
  );
}

describe("DashboardProjectHealthSection US-106", () => {
  it("shows backend member summary and explicit disconnected Jira state", () => {
    renderSection({ projects: [project] });

    expect(screen.getAllByText("Research Project").length).toBeGreaterThan(0);
    expect(screen.getAllByText("4").length).toBeGreaterThan(0);
    expect(screen.getAllByText("40%").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Not linked").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Open" })[0]).toHaveAttribute(
      "href",
      "/supervisor/projects/project-1",
    );
  });

  it("shows a create-project action for a true empty dashboard", () => {
    renderSection({ hasAnyProjects: false });

    expect(screen.getByText("No research projects yet")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Create project" }));
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/supervisor/projects/new",
    );
  });

  it("keeps search-empty state separate from no-projects state", () => {
    renderSection({ hasAnyProjects: true, hasSearchQuery: true });

    expect(screen.getByText("No projects found")).toBeInTheDocument();
    expect(
      screen.getByText("No supervised projects match your current search."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Create project" }),
    ).not.toBeInTheDocument();
  });
});
