import { PanelsTopLeft } from "lucide-react";
import { IntegrationEmptyState } from "@/components/ui/IntegrationEmptyState";
import { JiraProjectDataView } from "@/features/shared/jira/JiraProjectDataView";
import { studentApi } from "../../api/studentApi";
import type { StudentProjectDetail } from "../../types";

type StudentProjectJiraTabProps = {
  projectId: string | undefined;
  jira: StudentProjectDetail["jira"] | null | undefined;
};

export function StudentProjectJiraTab({
  projectId,
  jira,
}: StudentProjectJiraTabProps) {
  if (!projectId) return null;

  if (!jira?.connected) {
    return (
      <IntegrationEmptyState
        icon={<PanelsTopLeft className="h-8 w-8" />}
        title="No Jira workspace connected"
        description="Please wait for your supervisor to connect Jira to this project. Jira workspace management is restricted to supervisors."
      />
    );
  }

  return (
    <JiraProjectDataView
      projectId={projectId}
      issueFetcher={studentApi.getJiraIssues}
      sprintFetcher={studentApi.getJiraSprintProgress}
      workloadFetcher={studentApi.getJiraWorkload}
      syncStateFetcher={studentApi.getProjectJiraSyncState}
    />
  );
}
