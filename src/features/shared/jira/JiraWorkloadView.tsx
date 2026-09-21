import { ChevronDown, ChevronUp, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { BlockingState } from "@/components/ui/BlockingState";
import { JiraSyncMeta } from "./JiraSyncMeta";
import { JiraContributorIdentity, JiraMetricCard } from "./JiraVisuals";
import type { JiraWorkload } from "@/features/shared/types/jira.types";

type Props = {
  projectId: string;
  fetcher: (projectId: string) => Promise<JiraWorkload>;
};

function statusClass(category: string | null) {
  const value = category?.toLowerCase();
  if (value === "done") return "bg-emerald-50 text-emerald-700";
  if (
    value === "indeterminate" ||
    value === "in_progress" ||
    value === "in progress"
  )
    return "bg-blue-50 text-blue-700";
  return "bg-slate-100 text-slate-700";
}

export function JiraWorkloadView({ projectId, fetcher }: Props) {
  const [data, setData] = useState<JiraWorkload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetcher(projectId));
    } catch {
      setError("Unable to load Jira workload data.");
    } finally {
      setLoading(false);
    }
  }, [fetcher, projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) return <BlockingState isActive message="Loading Jira workload…" className="min-h-40" />;
  if (error && !data)
    return (
      <div className="rounded-3xl border border-rose-200 bg-white p-8 text-rose-700">
        {error}
      </div>
    );
  if (!data) return null;

  const hasLocalSnapshot = data.summary.totalIssues > 0;
  const neverSynced = !hasLocalSnapshot && !data.sync.lastSyncedAt && data.sync.status !== "SYNCED";
  const hasAssigneeData = data.members.length > 0;

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Jira workload</h3>
        <p className="text-sm text-slate-500">
          Current work distribution from the stored ResearchTrack Jira snapshot
        </p>
        <div className="mt-2"><JiraSyncMeta sync={data.sync} /></div>
      </div>

      {data.sync.status === "FAILED" && data.sync.lastSyncError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Latest Jira synchronization failed. Showing the last stored workload
          snapshot. {data.sync.lastSyncError}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-4">
        <JiraMetricCard label="Active work" value={data.summary.activeIssues} tone="active" />
        <JiraMetricCard label="Assigned active" value={data.summary.assignedActiveIssues} tone="todo" />
        <JiraMetricCard label="Unassigned active" value={data.summary.unassignedActiveIssues} tone="warning" />
        <JiraMetricCard label="Completed" value={data.summary.doneIssues} tone="done" />
      </div>

      {neverSynced ? (
        <EmptyState
          title="Jira workload has not been synchronized yet"
          description="Ask a supervisor to refresh Jira so ResearchTrack can build the local workload snapshot."
        />
      ) : !hasAssigneeData && data.unassigned.total === 0 ? (
        <EmptyState
          title="No workload data available"
          description="The synchronized Jira project currently has no issues with assignee activity to summarize."
        />
      ) : (
        <>
          {data.unassigned.total > 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="font-semibold text-amber-900">
                Unassigned work
              </div>
              <div className="mt-1 text-sm text-amber-800">
                {data.unassigned.active} active and {data.unassigned.done}{" "}
                completed issue{data.unassigned.total === 1 ? "" : "s"}{" "}
                currently have no Jira assignee.
              </div>
            </div>
          ) : null}

          {hasAssigneeData ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <Users className="h-4 w-4" />
                  Contributor workload
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Active work is any synchronized issue whose Jira status
                  category is not Done.
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {data.members.map((member) => {
                  const isOpen = !!expanded[member.accountId];
                  const max = Math.max(1, member.total);
                  return (
                    <div key={member.accountId}>
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded((current) => ({
                            ...current,
                            [member.accountId]: !isOpen,
                          }))
                        }
                        className="w-full p-5 text-left hover:bg-slate-50/70"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="min-w-[180px]">
                            <div className="font-semibold text-slate-900">
                              <JiraContributorIdentity accountId={member.accountId} displayName={member.displayName} />
                            </div>
                            <div className="text-xs text-slate-500">
                              {member.active} active · {member.done} completed
                              {member.activeStoryPoints != null
                                ? ` · ${member.activeStoryPoints} active pts`
                                : ""}
                            </div>
                          </div>
                          <div className="flex flex-1 items-center gap-2 sm:max-w-md">
                            <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                              <span
                                className="bg-slate-300"
                                style={{
                                  width: `${(member.toDo / max) * 100}%`,
                                }}
                              />
                              <span
                                className="bg-blue-500"
                                style={{
                                  width: `${(member.inProgress / max) * 100}%`,
                                }}
                              />
                              <span
                                className="bg-emerald-500"
                                style={{
                                  width: `${(member.done / max) * 100}%`,
                                }}
                              />
                            </div>
                            <div className="w-24 text-right text-xs text-slate-500">
                              {member.toDo} / {member.inProgress} /{" "}
                              {member.done}
                            </div>
                            {isOpen ? (
                              <ChevronUp className="h-4 w-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                        </div>
                      </button>
                      {isOpen ? (
                        <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3">
                          <div className="space-y-2">
                            {member.issues.map((issue) => (
                              <div
                                key={issue.issueKey}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                              >
                                <div>
                                  <span className="font-semibold text-slate-900">
                                    {issue.issueKey}
                                  </span>
                                  <span className="ml-2 text-slate-600">
                                    {issue.summary}
                                  </span>
                                </div>
                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(issue.statusCategory)}`}
                                >
                                  {issue.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
