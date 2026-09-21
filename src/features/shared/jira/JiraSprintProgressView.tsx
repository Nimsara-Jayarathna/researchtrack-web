import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Clock3,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { BlockingState } from "@/components/ui/BlockingState";
import { JiraSyncMeta } from "./JiraSyncMeta";
import { JiraMetricCard, type MetricTone } from "./JiraVisuals";
import type { JiraSprintProgress } from "@/features/shared/types/jira.types";

type Props = {
  projectId: string;
  fetcher: (projectId: string) => Promise<JiraSprintProgress>;
};

function formatDate(value: string | null) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function JiraSprintProgressView({ projectId, fetcher }: Props) {
  const [data, setData] = useState<JiraSprintProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetcher(projectId));
    } catch {
      setError("Unable to load synchronized Jira sprint progress.");
    } finally {
      setLoading(false);
    }
  }, [fetcher, projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data)
    return (
      <BlockingState
        isActive
        message="Loading current sprint progress…"
        className="min-h-40"
      />
    );
  if (error && !data)
    return (
      <div className="rounded-2xl border border-rose-200 bg-white p-8 text-sm text-rose-700">
        {error}
      </div>
    );
  if (!data) return null;

  const syncFailed =
    data.sync.status === "FAILED" || data.sync.status === "INVALID_AUTH";
  const neverSynced =
    !data.sync.lastSyncedAt && !syncFailed && data.sync.status !== "SYNCED";
  if (neverSynced)
    return (
      <EmptyState
        title="Sprint data has not been synchronized yet"
        description="The current sprint will appear after Jira data is synchronized for this project."
      />
    );
  if (syncFailed && !data.hasActiveSprint)
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <h3 className="font-semibold text-amber-950">
              Current sprint could not be refreshed
            </h3>
            <p className="mt-1 text-sm text-amber-800">
              {data.sync.lastSyncError ??
                "The latest Jira synchronization did not complete."}
            </p>
            <p className="mt-2 text-sm text-amber-800">
              Issue and workload views can continue using any previously stored
              ResearchTrack snapshot.
            </p>
          </div>
        </div>
      </div>
    );
  if (!data.hasActiveSprint || !data.activeSprint)
    return (
      <div className="space-y-4">
        <div className="flex justify-center">
          <JiraSyncMeta sync={data.sync} />
        </div>
        <EmptyState
          title="No active Jira sprint"
          description="The linked Jira Scrum board has no active sprint in the latest synchronized ResearchTrack snapshot. Refresh Jira after confirming the selected board if Jira shows an active sprint."
        />
      </div>
    );

  const sprint = data.activeSprint;
  const breakdown = sprint.statusBreakdown;
  const metrics: {
    label: string;
    value: number;
    icon: typeof CircleDot;
    tone: MetricTone;
  }[] = [
    { label: "To do", value: breakdown.toDo, icon: CircleDot, tone: "todo" },
    {
      label: "In progress",
      value: breakdown.inProgress,
      icon: Clock3,
      tone: "active",
    },
    { label: "Done", value: breakdown.done, icon: CheckCircle2, tone: "done" },
  ];

  return (
    <section id="jira-sprint-progress" className="space-y-4">
      <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Current sprint
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            {sprint.sprintName}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Latest locally synchronized Jira sprint progress
          </p>
          <div className="mt-2">
            <JiraSyncMeta sync={data.sync} />
          </div>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold capitalize text-emerald-700">
          {sprint.sprintState}
        </span>
      </div>

      {data.sync.status === "FAILED" ? (
        <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Latest Jira synchronization failed. Showing the last successfully
            stored sprint data.
          </span>
        </div>
      ) : null}

      <div className="grid gap-3 xl:grid-cols-[1.35fr_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Sprint completion
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {sprint.issuesDone} completed · {sprint.issuesRemaining}{" "}
                remaining · {sprint.issuesTotal} total
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-slate-900">
                {sprint.completionPercent}%
              </div>
              <div className="text-xs text-slate-400">complete</div>
            </div>
          </div>
          <div
            className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100"
            aria-label={`${sprint.completionPercent}% complete`}
          >
            <div
              className="h-full rounded-full bg-slate-900 transition-all"
              style={{
                width: `${Math.max(0, Math.min(100, sprint.completionPercent))}%`,
              }}
            />
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            {metrics.map(({ label, value, icon: Icon, tone }) => (
              <JiraMetricCard
                key={label}
                label={label}
                value={value}
                tone={tone}
                icon={<Icon className="h-4 w-4" />}
              />
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Sprint context</p>
          <div className="mt-4 space-y-4 text-sm">
            <div className="flex gap-3">
              <CalendarDays className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <div className="text-xs text-slate-400">Schedule</div>
                <div className="font-medium text-slate-700">
                  {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
                </div>
              </div>
            </div>
            {sprint.goal ? (
              <div>
                <div className="text-xs text-slate-400">Sprint goal</div>
                <p className="mt-1 leading-6 text-slate-700">{sprint.goal}</p>
              </div>
            ) : null}
            {sprint.sprintPointsAvailable ? (
              <div>
                <div className="text-xs text-slate-400">Story points</div>
                <div className="mt-1 font-medium text-slate-700">
                  {sprint.sprintPointsDone} of {sprint.sprintPointsTotal}{" "}
                  completed
                </div>
              </div>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  );
}
