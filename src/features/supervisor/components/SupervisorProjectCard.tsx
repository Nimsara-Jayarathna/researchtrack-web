import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressMeter } from "@/components/ui/ProgressMeter";
import { diffDaysDateOnly } from "@/lib/dateOnly";
import type { SupervisorProjectSummary } from "../types";

type SupervisorProjectCardProps = {
  project: SupervisorProjectSummary;
};

function deriveSignalSummary(project: SupervisorProjectSummary): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (project.milestoneDate) {
    const daysUntil = diffDaysDateOnly(project.milestoneDate, today);
    if (daysUntil !== null && daysUntil < 0) {
      const overdueDays = Math.abs(daysUntil);
      return overdueDays === 1
        ? "Primary milestone is overdue by 1 day and needs recovery action."
        : `Primary milestone is overdue by ${overdueDays} days and needs recovery action.`;
    }
  }

  if (project.lifecycleStatus === "BEHIND") {
    return "Lifecycle is behind. Prioritize blocker removal and milestone recovery.";
  }
  if (project.lifecycleStatus === "AT_RISK") {
    return "Lifecycle is at risk. Tighten near-term scope and confirm milestone owners.";
  }

  if (project.milestoneDate) {
    const daysUntil = diffDaysDateOnly(project.milestoneDate, today);
    if (daysUntil !== null && daysUntil <= 7) {
      return `Milestone due in ${daysUntil} day${daysUntil === 1 ? "" : "s"}. Validate readiness this week.`;
    }
  }

  return "Delivery signals are stable. Keep milestones and execution updates current.";
}

function lifecycleTone(project: SupervisorProjectSummary) {
  if (project.lifecycleStatus === "ACTIVE") return "success";
  if (project.lifecycleStatus === "AT_RISK") return "warning";
  if (project.lifecycleStatus === "BEHIND") return "danger";
  if (project.lifecycleStatus === "COMPLETED") return "neutral";
  return "student";
}

export function SupervisorProjectCard({ project }: SupervisorProjectCardProps) {
  const title = project.title;
  const summary = project.summary ?? "No summary provided yet.";
  const batch = project.batch ?? "Not set";
  const signalSummary = deriveSignalSummary(project);

  return (
    <Link
      to={`/supervisor/projects/${project.id}`}
      className="workspace-panel workspace-focus group flex h-full flex-col p-4 transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md sm:p-5"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <h2
          className="truncate text-lg font-semibold text-foreground"
          title={title}
        >
          {title}
        </h2>

        <div className="flex items-center gap-2">
          <StatusBadge
            tone={lifecycleTone(project)}
            className="tracking-normal"
          >
            {project.lifecycleStatus.replace("_", " ")}
          </StatusBadge>
          <span
            className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
            title="Reported project progress; lifecycle status is evaluated separately"
          >
            {project.progressPercent == null
              ? "—"
              : `${project.progressPercent}%`}
          </span>
        </div>
      </div>

      <p
        className="mt-1.5 overflow-hidden text-sm leading-[1.35rem] text-muted-foreground"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
        title={summary}
      >
        {summary}
      </p>

      <div className="mt-2.5 grid gap-2 sm:grid-cols-3">
        <div className="flex min-h-14 flex-col justify-center rounded-xl bg-slate-50 px-3 py-1.5">
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Members
          </p>
          <p className="mt-0.5 truncate text-[15px] font-semibold text-foreground">
            {project.memberCount}
          </p>
        </div>
        <div className="flex min-h-14 flex-col justify-center rounded-xl bg-slate-50 px-3 py-1.5">
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Milestone
          </p>
          <p
            className="mt-0.5 truncate text-[15px] font-semibold text-foreground"
            title={project.milestoneDate ?? "Not set"}
          >
            {project.milestoneDate ? project.milestoneDate : "Not set"}
          </p>
        </div>
        <div className="flex min-h-14 flex-col justify-center rounded-xl bg-slate-50 px-3 py-1.5">
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Batch
          </p>
          <p
            className="mt-0.5 truncate text-[15px] font-semibold text-foreground"
            title={batch}
          >
            {batch}
          </p>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <ProgressMeter value={project.progressPercent} />
      </div>
      <div className="mt-3 min-h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Delivery signal
        </p>
        <p
          className="mt-1 overflow-hidden text-xs leading-5 text-muted-foreground"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
          title={signalSummary}
        >
          {signalSummary}
        </p>
      </div>
    </Link>
  );
}
