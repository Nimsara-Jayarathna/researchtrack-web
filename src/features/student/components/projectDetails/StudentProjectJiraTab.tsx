import { JiraIssueProgressView } from "@/features/shared/jira/JiraIssueProgressView";
import { studentApi } from "../../api/studentApi";
import type { StudentProjectDetail } from "../../types";
type StudentProjectJiraTabProps = { projectId: string | undefined; jira: StudentProjectDetail["jira"] | null | undefined };
export function StudentProjectJiraTab({ projectId }: StudentProjectJiraTabProps) {
  return <section className="space-y-4">{projectId ? <JiraIssueProgressView projectId={projectId} fetcher={studentApi.getJiraIssues} /> : null}</section>;
}
