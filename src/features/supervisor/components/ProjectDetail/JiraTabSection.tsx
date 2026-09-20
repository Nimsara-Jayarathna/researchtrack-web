import { JiraIssueProgressView } from "@/features/shared/jira/JiraIssueProgressView";
import { supervisorApi } from "../../api/supervisorApi";
import type { SupervisorProjectDetail } from "../../types";
type JiraTabSectionProps = { project: SupervisorProjectDetail };
export function JiraTabSection({ project }: JiraTabSectionProps) {
  return <section>{project.jira?.connected ? <JiraIssueProgressView projectId={project.id} fetcher={supervisorApi.getJiraIssues} refresher={supervisorApi.refreshProjectJira} /> : <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">Jira workspace is not connected for this project. Connect it from the Integrations tab.</div>}</section>;
}
