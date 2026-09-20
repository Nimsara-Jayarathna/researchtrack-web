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

export type JiraWorkloadIssue = {
  issueKey: string;
  summary: string;
  status: string;
  statusCategory: string | null;
  completed: boolean;
};

export type JiraWorkloadMemberRow = {
  accountId: string;
  displayName: string;
  total: number;
  active: number;
  toDo: number;
  inProgress: number;
  done: number;
  activeStoryPoints: number | null;
  issues: JiraWorkloadIssue[];
  // Legacy presentation fields retained while older supervisor components are phased out.
  assigned: number;
  completed: number;
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
  unassigned: { total: number; active: number; done: number };
  summary: {
    totalIssues: number;
    activeIssues: number;
    doneIssues: number;
    assignedActiveIssues: number;
    unassignedActiveIssues: number;
  };
  sync: JiraSyncState;
  // Legacy fields retained for old components that are no longer mounted.
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
