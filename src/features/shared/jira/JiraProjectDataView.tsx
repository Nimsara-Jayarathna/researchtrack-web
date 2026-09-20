import { useState } from "react";
import type { JiraIssueList, JiraSprintProgress } from "@/features/shared/types/jira.types";
import { JiraIssueProgressView } from "./JiraIssueProgressView";
import { JiraSprintProgressView } from "./JiraSprintProgressView";

type Props = {
  projectId: string;
  issueFetcher: (projectId: string) => Promise<JiraIssueList>;
  sprintFetcher: (projectId: string) => Promise<JiraSprintProgress>;
  refresher?: (projectId: string) => Promise<unknown>;
};

type Tab = "issues" | "sprint";

export function JiraProjectDataView({ projectId, issueFetcher, sprintFetcher, refresher }: Props) {
  const [tab, setTab] = useState<Tab>("issues");
  return (
    <section className="space-y-5">
      <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1" aria-label="Jira project views">
        {([ ["issues", "Issues & tasks"], ["sprint", "Current sprint"] ] as const).map(([value, label]) => (
          <button key={value} type="button" onClick={() => setTab(value)} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{label}</button>
        ))}
      </div>
      {tab === "issues" ? <JiraIssueProgressView projectId={projectId} fetcher={issueFetcher} refresher={refresher} /> : <JiraSprintProgressView projectId={projectId} fetcher={sprintFetcher} />}
    </section>
  );
}
