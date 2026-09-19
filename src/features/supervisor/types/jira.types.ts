export type JiraAuthUrl = { url: string };
export type JiraOAuthCompletePayload = {
  code?: string | null;
  state?: string | null;
  error?: string | null;
  errorDescription?: string | null;
  selectionToken?: string | null;
  selectedCloudId?: string | null;
};
export type JiraWorkspaceOption = {
  cloudId: string;
  workspaceName: string;
  workspaceUrl: string | null;
};
export type JiraProjectOption = { id: string; key: string; name: string };
export type JiraBoardOption = { id: number; name: string; type: string };
export type JiraOAuthCompleteResult = {
  projectId: string;
  requiresWorkspaceSelection: boolean;
  requiresProjectSelection: boolean;
  selectionToken: string;
  workspaceOptions: JiraWorkspaceOption[];
  projectOptions: JiraProjectOption[];
  workspaceName: string | null;
};
export type JiraBoardListResult = { boards: JiraBoardOption[] };
export type JiraLinkPayload = {
  selectionToken: string;
  jiraProjectId: string;
  jiraBoardId: number | null;
};
export type JiraConnection = {
  connected: boolean;
  projectId: string;
  workspaceName: string;
  workspaceUrl: string | null;
  jiraProjectId: string;
  jiraProjectKey: string;
  jiraProjectName: string;
  jiraBoardId: number | null;
  jiraBoardName: string | null;
  jiraBoardType: string | null;
  syncStatus: string;
  lastSyncedAt: string | null;
  connectedAt: string;
};
export type {
  JiraHealth,
  JiraHierarchy,
  JiraHierarchyNode,
  JiraSprintProgress,
  JiraSprintSummary,
  JiraStatusBreakdown,
  JiraTypeDistributionItem,
  JiraVelocityWeek,
  JiraWorkload,
  JiraWorkloadMemberRow,
} from "@/features/shared/types/jira.types";
