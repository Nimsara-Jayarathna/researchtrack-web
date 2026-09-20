export type JiraStatusBreakdown = {
  toDo: number;
  inProgress: number;
  done: number;
};

export type JiraTypeDistributionItem = {
  type: string;
  count: number;
};

export type JiraHealth = {
  completionPercent: number;
  openIssues: number;
  overdueIssues: number;
  highPriorityOpen: number;
  statusBreakdown: JiraStatusBreakdown;
  typeDistribution: JiraTypeDistributionItem[];
  bugRatio: number;
  lastSyncedAt: string | null;
};

export type JiraSprintStatusBreakdown = {
  toDo: number;
  inProgress: number;
  done: number;
};

export type JiraCurrentSprint = {
  sprintId: number;
  sprintName: string;
  sprintState: string;
  goal: string | null;
  startDate: string | null;
  endDate: string | null;
  completeDate: string | null;
  statusBreakdown: JiraSprintStatusBreakdown;
  issuesTotal: number;
  issuesDone: number;
  issuesRemaining: number;
  completionPercent: number;
  sprintPointsAvailable: boolean;
  sprintPointsTotal: number;
  sprintPointsDone: number;
};

export type JiraSprintProgress = {
  hasActiveSprint: boolean;
  activeSprint: JiraCurrentSprint | null;
  sync: JiraSyncState;
};

export type JiraWorkloadMemberRow = {
  accountId: string;
  displayName: string;
  assigned: number;
  completed: number;
  inProgress: number;
  overdue: number;
  openIssues: number;
  storyPointsAssigned: number | null;
  storyPointsCompleted: number | null;
  completionRate: number;
  lastActiveDate: string;
  issueTypeCounts: Record<string, number>;
};

export type JiraWorkload = {
  members: JiraWorkloadMemberRow[];
  unassignedCount: number;
  dueDateAvailable: boolean;
  imbalanceDetected: boolean;
  imbalanceMessage: string | null;
};

export type JiraHierarchyNode = {
  issueKey: string;
  summary: string;
  issueType: string;
  status: string;
  priority: string | null;
  assigneeDisplayName: string | null;
  storyPoints: number | null;
  children: JiraHierarchyNode[];
};

export type JiraHierarchy = {
  roots: JiraHierarchyNode[];
  orphans: JiraHierarchyNode[];
};

export type JiraIssue = {
  issueKey: string;
  summary: string;
  issueType: string;
  status: string;
  statusCategory: string | null;
  priority: string | null;
  assigneeDisplayName: string | null;
  storyPoints: number | null;
  parentIssueKey: string | null;
  dueDate: string | null;
  updatedAt: string | null;
};
export type JiraIssueSummary = {
  total: number;
  toDo: number;
  inProgress: number;
  done: number;
};
export type JiraSyncState = {
  status: string;
  lastSyncedAt: string | null;
  lastSyncError: string | null;
};
export type JiraIssueList = {
  items: JiraIssue[];
  summary: JiraIssueSummary;
  sync: JiraSyncState;
};
