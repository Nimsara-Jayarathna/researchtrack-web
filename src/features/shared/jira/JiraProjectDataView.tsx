import { RefreshCw } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { JiraIssueList, JiraSprintProgress, JiraWorkload } from "@/features/shared/types/jira.types";
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
type CacheEntry<T> = { data: T; cachedAt: number };
const CACHE_TTL_MS = 60_000;
const issueCache = new Map<string, CacheEntry<JiraIssueList>>();
const sprintCache = new Map<string, CacheEntry<JiraSprintProgress>>();
const workloadCache = new Map<string, CacheEntry<JiraWorkload>>();
const inflight = new Map<string, Promise<unknown>>();

function cachedFetch<T>(kind: string, projectId: string, cache: Map<string, CacheEntry<T>>, fetcher: (id: string) => Promise<T>) {
  const entry = cache.get(projectId);
  if (entry && Date.now() - entry.cachedAt < CACHE_TTL_MS) return Promise.resolve(entry.data);
  const key = `${kind}:${projectId}`;
  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;
  const request = fetcher(projectId).then((data) => { cache.set(projectId, { data, cachedAt: Date.now() }); return data; }).finally(() => inflight.delete(key));
  inflight.set(key, request);
  return request;
}
function invalidate(projectId: string) { issueCache.delete(projectId); sprintCache.delete(projectId); workloadCache.delete(projectId); }

export function JiraProjectDataView({ projectId, issueFetcher, sprintFetcher, workloadFetcher, refresher }: Props) {
  const [tab, setTab] = useState<Tab>("issues");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const cachedIssueFetcher = useCallback((id: string) => cachedFetch("issues", id, issueCache, issueFetcher), [issueFetcher]);
  const cachedSprintFetcher = useCallback((id: string) => cachedFetch("sprints", id, sprintCache, sprintFetcher), [sprintFetcher]);
  const cachedWorkloadFetcher = useCallback((id: string) => cachedFetch("workload", id, workloadCache, workloadFetcher), [workloadFetcher]);
  const labels = useMemo(() => [["issues", "Issues & tasks"], ["sprint", "Sprints"], ["workload", "Workload"]] as const, []);
  const refresh = async () => {
    if (!refresher || refreshing) return;
    setRefreshing(true); setRefreshError(null);
    try { await refresher(projectId); invalidate(projectId); setRefreshVersion((v) => v + 1); }
    catch { setRefreshError("Unable to refresh Jira data. Existing synchronized data is still available."); }
    finally { setRefreshing(false); }
  };
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-between">
        <div className="hidden sm:block sm:w-[132px]" aria-hidden="true" />
        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-sm" aria-label="Jira project views">
          {labels.map(([value, label]) => <button key={value} type="button" onClick={() => setTab(value)} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{label}</button>)}
        </div>
        {refresher ? <button type="button" onClick={() => void refresh()} disabled={refreshing} className="inline-flex min-w-[132px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />{refreshing ? "Refreshing…" : "Refresh Jira"}</button> : <div className="hidden sm:block sm:w-[132px]" />}
      </div>
      {refreshError ? <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{refreshError}</div> : null}
      {tab === "issues" ? <JiraIssueProgressView key={`issues-${refreshVersion}`} projectId={projectId} fetcher={cachedIssueFetcher} /> : tab === "sprint" ? <JiraSprintProgressView key={`sprint-${refreshVersion}`} projectId={projectId} fetcher={cachedSprintFetcher} /> : <JiraWorkloadView key={`workload-${refreshVersion}`} projectId={projectId} fetcher={cachedWorkloadFetcher} />}
    </section>
  );
}
