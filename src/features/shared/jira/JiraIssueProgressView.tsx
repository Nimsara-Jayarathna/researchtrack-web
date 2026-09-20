import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/feedback/EmptyState";
import type { JiraIssueList } from "@/features/shared/types/jira.types";

type Props = {
  projectId: string;
  fetcher: (projectId: string) => Promise<JiraIssueList>;
  refresher?: (projectId: string) => Promise<unknown>;
};

function statusClass(category: string | null) {
  const value = category?.toLowerCase();
  if (value === "done") return "bg-emerald-50 text-emerald-700";
  if (value === "indeterminate" || value === "in_progress")
    return "bg-blue-50 text-blue-700";
  return "bg-slate-100 text-slate-700";
}

export function JiraIssueProgressView({
  projectId,
  fetcher,
  refresher,
}: Props) {
  const [data, setData] = useState<JiraIssueList | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetcher(projectId));
    } catch {
      setError("Unable to load synchronized Jira issues.");
    } finally {
      setLoading(false);
    }
  }, [fetcher, projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = async () => {
    if (!refresher || refreshing) return;
    setRefreshing(true);
    setError(null);
    try {
      await refresher(projectId);
      await load();
    } catch {
      setError(
        "Unable to refresh Jira data. Existing synchronized data is still available.",
      );
    } finally {
      setRefreshing(false);
    }
  };

  if (loading && !data)
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-500">
        Loading synchronized Jira issues…
      </div>
    );
  if (error && !data)
    return (
      <div className="rounded-3xl border border-rose-200 bg-white p-8 text-rose-700">
        {error}
      </div>
    );
  if (!data) return null;

  const hasLocalSnapshot = data.items.length > 0;
  const neverSynced = !hasLocalSnapshot && !data.sync.lastSyncedAt && data.sync.status !== "SYNCED";
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Jira issues & task progress
          </h3>
          <p className="text-sm text-slate-500">
            Stored ResearchTrack snapshot
            {data.sync.lastSyncedAt
              ? ` · synced ${new Date(data.sync.lastSyncedAt).toLocaleString()}`
              : ""}
          </p>
        </div>
        {refresher ? (
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing…" : "Refresh Jira"}
          </button>
        ) : null}
      </div>
      {error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      ) : null}
      {data.sync.status === "FAILED" && data.sync.lastSyncError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Latest Jira synchronization failed. Showing the last stored data.{" "}
          {data.sync.lastSyncError}
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Total", data.summary.total],
          ["To do", data.summary.toDo],
          ["In progress", data.summary.inProgress],
          ["Done", data.summary.done],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="text-sm text-slate-500">{label}</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">
              {value}
            </div>
          </div>
        ))}
      </div>
      {neverSynced ? (
        <EmptyState
          title="Jira issues have not been synchronized yet"
          description={
            refresher
              ? "Use Refresh Jira to create the local ResearchTrack issue snapshot."
              : "Ask your supervisor to synchronize Jira data."
          }
        />
      ) : data.items.length === 0 ? (
        <EmptyState
          title="No synchronized Jira issues"
          description="The linked Jira project currently has no issues available in the ResearchTrack snapshot."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Key</th>
                <th className="px-4 py-3">Issue</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Assignee</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((issue) => (
                <tr
                  key={issue.issueKey}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {issue.issueKey}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {issue.summary}
                    </div>
                    <div className="text-xs text-slate-500">
                      {issue.issueType}
                      {issue.storyPoints != null
                        ? ` · ${issue.storyPoints} pts`
                        : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(issue.statusCategory)}`}
                    >
                      {issue.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {issue.priority ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {issue.assigneeDisplayName ?? "Unassigned"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
