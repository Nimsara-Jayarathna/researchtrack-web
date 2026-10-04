import type { SupervisorProjectLifecycle } from "./project.types";

export type SupervisorDashboardStats = {
  total: number;
  active: number;
  atRisk: number;
  behind: number;
  overdueActions: number;
};

export type SupervisorDashboardProjectItem = {
  id: string;
  title: string;
  summary: string | null;
  lifecycleStatus: SupervisorProjectLifecycle;
  milestoneDate: string | null;
  lastActivityAt: string | null;
  progressPercent: number | null;
  memberCount: number;
  jiraHealthIndicator:
    | "AT_RISK"
    | "BEHIND"
    | "HEALTHY"
    | "NOT_CONNECTED"
    | "UNAVAILABLE"
    | null;
};

export type SupervisorDashboard = {
  totalProjects: number;
  planningProjects: number;
  activeProjects: number;
  atRiskProjects: number;
  behindProjects: number;
  completedProjects: number;
  upcomingMilestonesCount: number;
  jiraAtRiskCount: number;
  jiraBehindCount: number;
  jiraConnectedCount?: number;
  jiraMetricsStatus?: "READY" | "UNAVAILABLE";
  projects: SupervisorDashboardProjectItem[];
  recentProjects: SupervisorDashboardProjectItem[];
};

export type SupervisorDashboardJiraProjectHealth = {
  projectId: string;
  connected: boolean;
  indicator: "AT_RISK" | "BEHIND" | "HEALTHY" | "NOT_CONNECTED";
  completionPercent: number;
  openIssues: number;
  overdueIssues: number;
  highPriorityOpen: number;
  syncStatus: string | null;
  lastSyncedAt: string | null;
};

export type SupervisorDashboardJiraHealth = {
  connectedCount: number;
  atRiskCount: number;
  behindCount: number;
  projects: SupervisorDashboardJiraProjectHealth[];
};
