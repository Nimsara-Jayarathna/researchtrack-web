import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  CircleDot,
  Clock3,
  Gauge,
  ListChecks,
  Target,
  Timer,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { JiraMetricCard, type MetricTone } from "./JiraVisuals";
import type {
  JiraCurrentSprint,
  JiraSprintProgress,
} from "@/features/shared/types/jira.types";

type Props = {
  projectId: string;
  refreshKey?: number;
  fetcher: (projectId: string) => Promise<JiraSprintProgress>;
};
type Filter = "all" | "active" | "future" | "closed";

function formatDate(value: string | null) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function stateLabel(state: string) {
  const s = state.toLowerCase();
  return s === "future"
    ? "Planned"
    : s === "closed"
      ? "Completed"
      : s === "active"
        ? "Active"
        : state;
}
function stateTone(state: string) {
  const s = state.toLowerCase();
  if (s === "active")
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (s === "future") return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-slate-200 bg-slate-100 text-slate-600";
}
function daysBetween(start: string | null, end: string | null) {
  if (!start || !end) return null;
  const startMs = Date.parse(start);
  const endMs = Date.parse(end);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return null;
  return Math.max(0, Math.ceil((endMs - startMs) / 86_400_000));
}
function relativeSchedule(sprint: JiraCurrentSprint) {
  const now = Date.now();
  const state = sprint.sprintState.toLowerCase();
  if (state === "closed")
    return sprint.completeDate
      ? `Completed ${formatDate(sprint.completeDate)}`
      : "Completed";
  if (state === "future" && sprint.startDate) {
    const days = Math.max(
      0,
      Math.ceil((Date.parse(sprint.startDate) - now) / 86_400_000),
    );
    return days === 0
      ? "Starts today"
      : `Starts in ${days} day${days === 1 ? "" : "s"}`;
  }
  if (state === "active" && sprint.endDate) {
    const days = Math.max(
      0,
      Math.ceil((Date.parse(sprint.endDate) - now) / 86_400_000),
    );
    return days === 0
      ? "Ends today"
      : `${days} day${days === 1 ? "" : "s"} remaining`;
  }
  return "Schedule available";
}
function sortSprints(items: JiraCurrentSprint[]) {
  const rank = (s: string) =>
    s.toLowerCase() === "active" ? 0 : s.toLowerCase() === "future" ? 1 : 2;
  return [...items].sort(
    (a, b) =>
      rank(a.sprintState) - rank(b.sprintState) ||
      (Date.parse(b.startDate ?? "") || 0) -
        (Date.parse(a.startDate ?? "") || 0) ||
      b.sprintId - a.sprintId,
  );
}

function SprintCard({
  sprint,
  open,
  onToggle,
}: {
  sprint: JiraCurrentSprint;
  open: boolean;
  onToggle: () => void;
}) {
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
  const duration = daysBetween(sprint.startDate, sprint.endDate);
  const pointsRemaining = Math.max(
    0,
    sprint.sprintPointsTotal - sprint.sprintPointsDone,
  );
  const completion = Math.max(0, Math.min(100, sprint.completionPercent));

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${sprint.sprintState.toLowerCase() === "active" ? "border-emerald-200" : "border-slate-200"}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-slate-50/70"
        aria-expanded={open}
      >
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500">
          {open ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-slate-900">
              {sprint.sprintName}
            </h3>
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${stateTone(sprint.sprintState)}`}
            >
              {stateLabel(sprint.sprintState)}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
            <span>
              {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
            </span>
            <span>{sprint.issuesTotal} issues</span>
            {sprint.sprintPointsAvailable ? (
              <span>{sprint.sprintPointsTotal} pts</span>
            ) : null}
            <span className="font-medium text-slate-700">
              {completion}% complete
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-800"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </button>
      {open ? (
        <div className="border-t border-slate-100 px-5 py-5">
          <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
            <div>
              <div className="grid gap-2 sm:grid-cols-3">
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
              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <Target className="h-4 w-4" />
                  Sprint goal
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {sprint.goal?.trim() ||
                    "No sprint goal was provided in Jira."}
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex gap-2">
                  <CalendarDays className="mt-0.5 h-4 w-4 text-slate-400" />
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Sprint overview
                    </div>
                    <div className="mt-1 text-sm font-medium text-slate-700">
                      {formatDate(sprint.startDate)} –{" "}
                      {formatDate(sprint.endDate)}
                    </div>
                  </div>
                </div>
                <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {relativeSchedule(sprint)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-5 gap-y-5 pt-4 text-sm">
                <div className="flex gap-2">
                  <Timer className="mt-0.5 h-4 w-4 text-slate-400" />
                  <div>
                    <div className="text-xs text-slate-400">Duration</div>
                    <div className="mt-1 font-semibold text-slate-800">
                      {duration === null ? "Not set" : `${duration} days`}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Gauge className="mt-0.5 h-4 w-4 text-slate-400" />
                  <div>
                    <div className="text-xs text-slate-400">Completion</div>
                    <div className="mt-1 font-semibold text-slate-800">
                      {completion}%
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <ListChecks className="mt-0.5 h-4 w-4 text-slate-400" />
                  <div>
                    <div className="text-xs text-slate-400">Issues</div>
                    <div className="mt-1 font-semibold text-slate-800">
                      {sprint.issuesDone} / {sprint.issuesTotal} done
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {sprint.issuesRemaining} remaining
                    </div>
                  </div>
                </div>
                {sprint.sprintPointsAvailable ? (
                  <div className="flex gap-2">
                    <TrendingUp className="mt-0.5 h-4 w-4 text-slate-400" />
                    <div>
                      <div className="text-xs text-slate-400">Story points</div>
                      <div className="mt-1 font-semibold text-slate-800">
                        {sprint.sprintPointsDone} / {sprint.sprintPointsTotal}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {pointsRemaining} remaining
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <TrendingUp className="mt-0.5 h-4 w-4 text-slate-400" />
                    <div>
                      <div className="text-xs text-slate-400">Story points</div>
                      <div className="mt-1 font-semibold text-slate-800">
                        Not available
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-500">
                    Sprint progress
                  </span>
                  <span className="font-semibold text-slate-700">
                    {completion}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-800"
                    style={{ width: `${completion}%` }}
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>{breakdown.toDo} to do</span>
                  <span>{breakdown.inProgress} in progress</span>
                  <span>{breakdown.done} done</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function JiraSprintProgressView({
  projectId,
  fetcher,
  refreshKey = 0,
}: Props) {
  const [data, setData] = useState<JiraSprintProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetcher(projectId);
      setData(next);
      setExpanded(
        new Set(
          next.sprints
            .filter((x) => x.sprintState.toLowerCase() === "active")
            .map((x) => x.sprintId),
        ),
      );
    } catch {
      setError("Unable to load synchronized Jira sprints.");
    } finally {
      setLoading(false);
    }
  }, [fetcher, projectId]);
  useEffect(() => {
    void load();
  }, [load, refreshKey]);
  const sprints = useMemo(
    () =>
      sortSprints(
        (data?.sprints ?? []).filter(
          (x) => filter === "all" || x.sprintState.toLowerCase() === filter,
        ),
      ),
    [data?.sprints, filter],
  );
  if (loading && !data)
    return (
      <section className="space-y-4" aria-label="Loading Jira sprints">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <SkeletonCard lines={3} />
        <SkeletonCard lines={3} />
      </section>
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
        description="Sprints will appear after Jira data is synchronized for this project."
      />
    );
  const filters: [Filter, string, number][] = [
    ["all", "All", data.summary.total],
    ["active", "Active", data.summary.active],
    ["future", "Planned", data.summary.future],
    ["closed", "Completed", data.summary.closed],
  ];
  return (
    <section id="jira-sprints" className="space-y-4">
      {syncFailed ? (
        <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Latest Jira synchronization failed. Showing the last complete sprint
            snapshot. {data.sync.lastSyncError}
          </span>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {filters.map(([value, label, count]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${filter === value ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            {label} <span className="ml-1 opacity-70">{count}</span>
          </button>
        ))}
      </div>
      {data.sprints.length === 0 ? (
        <EmptyState
          title="No Jira sprints synchronized"
          description="The selected Jira board has no available sprints in the latest ResearchTrack snapshot."
        />
      ) : sprints.length === 0 ? (
        <EmptyState
          title="No sprints in this filter"
          description="Choose another sprint state to view the synchronized sprint history."
        />
      ) : (
        <div className="space-y-3">
          {sprints.map((s) => (
            <SprintCard
              key={s.sprintId}
              sprint={s}
              open={expanded.has(s.sprintId)}
              onToggle={() =>
                setExpanded((current) => {
                  const next = new Set(current);
                  next.has(s.sprintId)
                    ? next.delete(s.sprintId)
                    : next.add(s.sprintId);
                  return next;
                })
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
