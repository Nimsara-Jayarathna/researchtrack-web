import {
  ArrowUpRight,
  CalendarDays,
  GraduationCap,
  Users,
  AlertTriangle,
  Clock3,
} from "lucide-react";
import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressMeter } from "@/components/ui/ProgressMeter";
import { projectDateLabel } from "@/features/projects/utils/projectDateLabel";
import { diffDaysDateOnly } from "@/lib/dateOnly";
import type { SupervisorProjectSummary } from "../types";

type SupervisorProjectCardProps = {
  project: SupervisorProjectSummary;
};

/** UI hint only. Backend lifecycle status remains the source of truth. */
function deliveryHint(
  project: SupervisorProjectSummary,
): { text: string; urgent: boolean } | null {
  if (project.lifecycleStatus === "COMPLETED") return null;
  if (project.lifecycleStatus === "BEHIND") {
    return { text: "Lifecycle behind · Review blockers", urgent: true };
  }
  if (project.lifecycleStatus === "AT_RISK") {
    return { text: "Lifecycle at risk · Review delivery", urgent: true };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntil = project.milestoneDate
    ? diffDaysDateOnly(project.milestoneDate, today)
    : null;
  if (daysUntil !== null && daysUntil < 0) {
    const days = Math.abs(daysUntil);
    // Summary API does not include milestone completion state. Don't label a past date as "overdue".
    return {
      text: `Milestone date passed ${days} day${days === 1 ? "" : "s"} ago · Check status`,
      urgent: false,
    };
  }
  if (daysUntil !== null && daysUntil <= 7) {
    return {
      text:
        daysUntil === 0
          ? "Milestone due today"
          : `Milestone due in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`,
      urgent: false,
    };
  }
  return null;
}

function lifecycleTone(project: SupervisorProjectSummary) {
  if (project.lifecycleStatus === "ACTIVE") return "success";
  if (project.lifecycleStatus === "AT_RISK") return "warning";
  if (project.lifecycleStatus === "BEHIND") return "danger";
  if (project.lifecycleStatus === "COMPLETED") return "neutral";
  return "student";
}

export function SupervisorProjectCard({ project }: SupervisorProjectCardProps) {
  const summary = project.summary ?? "No summary provided yet.";
  const hint = deliveryHint(project);
  return (
    <Link
      to={`/supervisor/projects/${project.id}`}
      className="workspace-panel workspace-focus group flex h-full min-w-0 flex-col p-4 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
      aria-label={`Open project ${project.title}`}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2
            className="truncate text-[17px] font-semibold leading-6 tracking-tight text-slate-950"
            title={project.title}
          >
            {project.title}
          </h2>
          <p
            className="mt-1 line-clamp-2 text-[13px] leading-5 text-slate-500"
            title={summary}
          >
            {summary}
          </p>
        </div>
        <StatusBadge
          tone={lifecycleTone(project)}
          className="shrink-0 tracking-normal"
        >
          {project.lifecycleStatus.replace("_", " ")}
        </StatusBadge>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
        <span
          className="inline-flex items-center gap-1.5"
          title={`${project.memberCount} members`}
        >
          <Users className="h-3.5 w-3.5 text-slate-400" aria-hidden />
          {project.memberCount} members
        </span>
        <span
          className="inline-flex items-center gap-1.5"
          title={`Batch: ${project.batch ?? "Not set"}`}
        >
          <GraduationCap className="h-3.5 w-3.5 text-slate-400" aria-hidden />
          {project.batch ? `Batch ${project.batch}` : "Batch not set"}
        </span>
        <span
          className="inline-flex items-center gap-1.5"
          title={`Milestone: ${project.milestoneDate ?? "Not set"}`}
        >
          <CalendarDays className="h-3.5 w-3.5 text-slate-400" aria-hidden />
          {projectDateLabel(project.milestoneDate)}
        </span>
      </div>

      <div className="mt-3">
        <ProgressMeter value={project.progressPercent} />
      </div>

      {hint ? (
        <div
          className={`mt-3 flex items-start gap-2 rounded-xl px-2.5 py-2 text-xs leading-5 ${hint.urgent ? "bg-amber-50/80 text-amber-900" : "bg-sky-50 text-sky-800"}`}
        >
          {hint.urgent ? (
            <AlertTriangle
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
              aria-hidden
            />
          ) : (
            <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          )}
          <span className="min-w-0 flex-1">{hint.text}</span>
        </div>
      ) : null}
      <span className="mt-auto inline-flex items-center gap-1 self-end pt-3 text-xs font-semibold text-sky-700 opacity-80 transition group-hover:opacity-100">
        Open project <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
      </span>
    </Link>
  );
}
