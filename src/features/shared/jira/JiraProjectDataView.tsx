import { useState } from "react";
import type {
  JiraIssueList,
  JiraSprintProgress,
  JiraWorkload,
} from "@/features/shared/types/jira.types";
import { JiraIssueProgressView } from "./JiraIssueProgressView";
import { JiraSprintProgressView } from "./JiraSprintProgressView";
import { JiraWorkloadView } from "./JiraWorkloadView";

type Props = {
  projectId: string;
  issueFetcher: (projectId: string) => Promise<JiraIssueList>;
  sprintFetcher: (projectId: string) => Promise<JiraSprintProgress>;
  workloadFetcher: (projectId: string) => Promise<JiraWorkload>;
  refresher?: (projectId: string) => Promise<unknown>;
};

type Tab = "issues" | "sprint" | "workload";

export function JiraProjectDataView({
  projectId,
  issueFetcher,
  sprintFetcher,
  workloadFetcher,
  refresher,
}: Props) {
  const [tab, setTab] = useState<Tab>("issues");
  return (
    <section className="space-y-2">
      <div className="flex justify-center">
      <div
        className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-sm"
        aria-label="Jira project views"
      >
        {(
          [
            ["issues", "Issues & tasks"],
            ["sprint", "Current sprint"],
            ["workload", "Workload"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          >
            {label}
          </button>
        ))}
      </div>
      </div>
      {tab === "issues" ? (
        <JiraIssueProgressView
          projectId={projectId}
          fetcher={issueFetcher}
          refresher={refresher}
        />
      ) : tab === "sprint" ? (
        <JiraSprintProgressView projectId={projectId} fetcher={sprintFetcher} />
      ) : (
        <JiraWorkloadView projectId={projectId} fetcher={workloadFetcher} />
      )}
    </section>
  );
}
