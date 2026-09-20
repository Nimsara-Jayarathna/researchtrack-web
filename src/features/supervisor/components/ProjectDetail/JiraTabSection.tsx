import { JiraProjectDataView } from "@/features/shared/jira/JiraProjectDataView";
import { supervisorApi } from "../../api/supervisorApi";
import type { SupervisorProjectDetail } from "../../types";
type JiraTabSectionProps = { project: SupervisorProjectDetail };
export function JiraTabSection({ project }: JiraTabSectionProps) {
  return (
    <section>
      {project.jira?.connected ? (
        <JiraProjectDataView
          projectId={project.id}
          issueFetcher={supervisorApi.getJiraIssues}
          sprintFetcher={supervisorApi.getJiraSprintProgress}
          refresher={supervisorApi.refreshProjectJira}
        />
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          Jira workspace is not connected for this project. Connect it from the Integrations tab.
        </div>
      )}
    </section>
  );
}
