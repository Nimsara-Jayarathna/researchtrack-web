import type { SupervisorDashboard } from "../../types";
import { DashboardStatCard } from "./DashboardStatCard";

const DASHBOARD_STATS = [
  {
    key: "totalProjects",
    label: "Total projects",
    tone: "primary",
    icon: "total",
    getValue: (dashboard: SupervisorDashboard) => dashboard.totalProjects,
  },
  {
    key: "activeProjects",
    label: "Active",
    tone: "success",
    icon: "active",
    getValue: (dashboard: SupervisorDashboard) => dashboard.activeProjects,
  },
  {
    key: "atRiskProjects",
    label: "At risk",
    tone: "warning",
    icon: "risk",
    getValue: (dashboard: SupervisorDashboard) => dashboard.atRiskProjects,
  },
  {
    key: "behindProjects",
    label: "Behind",
    tone: "danger",
    icon: "behind",
    getValue: (dashboard: SupervisorDashboard) => dashboard.behindProjects,
  },
  {
    key: "upcomingMilestonesCount",
    label: "Upcoming milestones",
    tone: "info",
    icon: "milestone",
    getValue: (dashboard: SupervisorDashboard) =>
      dashboard.upcomingMilestonesCount,
  },
  {
    key: "jiraAtRiskCount",
    label: "Jira at risk",
    tone: "warning",
    icon: "jiraRisk",
    getValue: (dashboard: SupervisorDashboard) => dashboard.jiraAtRiskCount,
  },
  {
    key: "jiraBehindCount",
    label: "Jira behind",
    tone: "danger",
    icon: "jiraBehind",
    getValue: (dashboard: SupervisorDashboard) => dashboard.jiraBehindCount,
  },
] as const;

type DashboardStatsSectionProps = {
  dashboard: SupervisorDashboard | null;
  isLoading: boolean;
};

export function DashboardStatsSection({
  dashboard,
  isLoading,
}: DashboardStatsSectionProps) {
  const showSkeleton = isLoading || !dashboard;
  const jiraMetricsUnavailable = dashboard?.jiraMetricsStatus === "UNAVAILABLE";
  const hasConnectedJiraProject =
    dashboard?.projects.some(
      (project) =>
        project.jiraHealthIndicator !== null &&
        project.jiraHealthIndicator !== "NOT_CONNECTED" &&
        project.jiraHealthIndicator !== "UNAVAILABLE",
    ) ?? false;

  return (
    <section aria-labelledby="portfolio-overview-title" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="portfolio-overview-title"
          className="text-lg font-semibold tracking-tight text-slate-900"
        >
          Portfolio overview
        </h2>
        <p className="text-xs text-slate-500">
          Project delivery and connected Jira signals
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {DASHBOARD_STATS.slice(0, 4).map((stat) => renderStat(stat))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {DASHBOARD_STATS.slice(4).map((stat) => renderStat(stat, true))}
      </div>
    </section>
  );

  function renderStat(stat: (typeof DASHBOARD_STATS)[number], compact = false) {
    return (
      <DashboardStatCard
        key={stat.key}
        label={stat.label}
        tone={stat.tone}
        icon={stat.icon}
        compact={compact}
        value={
          showSkeleton || !dashboard ? undefined : (stat.key ===
              "jiraAtRiskCount" ||
              stat.key === "jiraBehindCount") &&
            jiraMetricsUnavailable ? (
            <span className="text-sm font-semibold normal-case tracking-normal text-slate-500">
              Unavailable
            </span>
          ) : (stat.key === "jiraAtRiskCount" ||
              stat.key === "jiraBehindCount") &&
            !hasConnectedJiraProject ? (
            <span className="text-sm font-semibold normal-case tracking-normal text-slate-500">
              Not linked
            </span>
          ) : (
            stat.getValue(dashboard)
          )
        }
        loading={showSkeleton}
      />
    );
  }
}
