import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SupervisorDashboard } from "../../types";
import { DashboardStatsSection } from "./DashboardStatsSection";
import { DashboardStatCard } from "./DashboardStatCard";
import { ProductPreview } from "@/features/landing/components/ProductPreview";

const baseDashboard: SupervisorDashboard = {
  totalProjects: 1,
  planningProjects: 1,
  activeProjects: 0,
  atRiskProjects: 0,
  behindProjects: 0,
  completedProjects: 0,
  upcomingMilestonesCount: 0,
  jiraAtRiskCount: 0,
  jiraBehindCount: 0,
  jiraMetricsStatus: "READY",
  projects: [
    {
      id: "example-project",
      title: "Example Research",
      summary: "Project summary",
      lifecycleStatus: "PLANNING",
      milestoneDate: "2026-10-01",
      lastActivityAt: null,
      progressPercent: 0,
      memberCount: 2,
      jiraHealthIndicator: "NOT_CONNECTED",
    },
  ],
  recentProjects: [],
};

describe("V5 dashboard-to-landing consistency", () => {
  it("keeps all seven real metrics and explains lifecycle vs deadline attention", () => {
    render(
      <DashboardStatsSection dashboard={baseDashboard} isLoading={false} />,
    );
    const grid = screen.getByTestId("portfolio-metrics-grid");
    expect(grid.className).toContain("2xl:grid-cols-7");
    expect(within(grid).getByText("Total projects")).toBeInTheDocument();
    expect(within(grid).getByText("Upcoming milestones")).toBeInTheDocument();
    expect(within(grid).getAllByText("Not linked")).toHaveLength(2);
    expect(
      screen.getByText(/upcoming counts exclude overdue dates/i),
    ).toBeInTheDocument();
  });

  it("keeps disconnected Jira statistics visually neutral", () => {
    const { container } = render(
      <DashboardStatsSection dashboard={baseDashboard} isLoading={false} />,
    );
    for (const element of screen.getAllByText("Not linked")) {
      expect(element.closest("div.relative.flex")?.className).toContain(
        "border-slate-200",
      );
      expect(element.closest("div.relative.flex")?.textContent).toContain(
        "Jira",
      );
    }
    expect(
      container.querySelectorAll(
        '[data-testid="portfolio-metrics-grid"] > div',
      ),
    ).toHaveLength(2);
  });

  it("uses the shared metric card in the actual dashboard", () => {
    const { container } = render(
      <DashboardStatCard
        label="Example"
        value={42}
        icon="total"
        tone="primary"
      />,
    );
    expect(screen.getByText("Example")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("rounded-[18px]");
  });

  it("keeps sample preview clearly fictional and includes real dashboard information fields", () => {
    const { container } = render(<ProductPreview />);
    expect(container.textContent).toContain("Fictional sample data");
    expect(container.textContent).toContain("Members");
    expect(container.textContent).toContain("Jira health");
    expect(container.textContent).toContain("Upcoming milestones");
    expect(
      container.querySelector('[data-testid="marketing-portfolio-metrics"]'),
    ).toBeTruthy();
  });
});
