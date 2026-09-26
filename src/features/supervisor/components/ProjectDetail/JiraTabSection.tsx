import { PanelsTopLeft } from "lucide-react";
import { buttonStyles } from "@/components/ui/Button";
import { IntegrationEmptyState } from "@/components/ui/IntegrationEmptyState";
import { JiraProjectDataView } from "@/features/shared/jira/JiraProjectDataView";
import { supervisorApi } from "../../api/supervisorApi";
import type { SupervisorProjectDetail } from "../../types";

type JiraTabSectionProps = {
  project: SupervisorProjectDetail;
  onConnect?: () => void;
  isConnecting?: boolean;
};

export function JiraTabSection({
  project,
  onConnect,
  isConnecting = false,
}: JiraTabSectionProps) {
  if (project.jira?.connected) {
    return (
      <JiraProjectDataView
        projectId={project.id}
        issueFetcher={supervisorApi.getJiraIssues}
        sprintFetcher={supervisorApi.getJiraSprintProgress}
        workloadFetcher={supervisorApi.getJiraWorkload}
        refresher={supervisorApi.refreshProjectJira}
        syncStateFetcher={supervisorApi.getProjectJiraSyncState}
      />
    );
  }

  return (
    <IntegrationEmptyState
      icon={<PanelsTopLeft className="h-8 w-8" />}
      title="No Jira workspace connected"
      description="Connect a Jira workspace to start tracking issues, sprints, workload, and project activity."
      action={
        onConnect ? (
          <button
            type="button"
            className={buttonStyles({ variant: "primary", size: "sm" })}
            onClick={onConnect}
            disabled={isConnecting}
          >
            {isConnecting ? "Connecting…" : "Connect Jira"}
          </button>
        ) : undefined
      }
    />
  );
}
