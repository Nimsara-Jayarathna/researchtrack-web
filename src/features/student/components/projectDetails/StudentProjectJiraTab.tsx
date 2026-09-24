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
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
        Jira is not connected for this project.
      </div>
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
