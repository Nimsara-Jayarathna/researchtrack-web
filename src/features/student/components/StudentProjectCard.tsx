import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  GraduationCap,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressMeter } from "@/components/ui/ProgressMeter";
import { projectDateLabel } from "@/features/projects/utils/projectDateLabel";
import type { StudentProjectSummary } from "../types";

type StudentProjectCardProps = { project: StudentProjectSummary };

function statusTone(status: StudentProjectSummary["status"]) {
  if (status === "ACTIVE") return "success";
  if (status === "AT_RISK") return "warning";
  if (status === "BEHIND") return "danger";
  if (status === "COMPLETED") return "neutral";
  return "student";
}

const activityFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function StudentProjectCard({ project }: StudentProjectCardProps) {
  const summary = project.summary ?? "No summary has been added yet.";
  const supervisorName = project.supervisorName ?? "Not available";
  const batch = project.batch ?? "Batch N/A";
  const semester = project.semester ?? "Semester N/A";
  const activityDate = project.lastActivityAt
    ? new Date(project.lastActivityAt)
    : null;
  const activityLabel =
    activityDate && !Number.isNaN(activityDate.getTime())
      ? `Updated ${activityFormatter.format(activityDate)}`
      : "No activity yet";

  return (
    <Link
      to={`/student/projects/${project.id}`}
      aria-label={`Open project ${project.title}`}
      className="workspace-panel workspace-focus group flex h-full min-w-0 flex-col p-4 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3
            className="truncate text-[17px] font-semibold leading-6 tracking-tight text-slate-950"
            title={project.title}
          >
            {project.title}
          </h3>
          <p
            className="mt-1 line-clamp-2 text-[13px] leading-5 text-slate-500"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
            title={summary}
          >
            {summary}
          </p>
        </div>
        <StatusBadge
          tone={statusTone(project.status)}
          className="shrink-0 tracking-normal"
        >
          {project.status.replace("_", " ")}
        </StatusBadge>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <UserRound
            className="h-3.5 w-3.5 shrink-0 text-slate-400"
            aria-hidden
          />
          <span className="max-w-40 truncate" title={supervisorName}>
            {supervisorName}
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5" title={batch}>
          <GraduationCap className="h-3.5 w-3.5 text-slate-400" aria-hidden />
          {batch}
        </span>
        <span className="inline-flex items-center gap-1.5" title={semester}>
          {semester}
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
      <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-xs">
        <span
          className="inline-flex items-center gap-1.5 text-slate-500"
          title={activityLabel}
        >
          <Clock3 className="h-3.5 w-3.5" aria-hidden />
          {activityLabel}
        </span>
        <span className="inline-flex items-center gap-1 font-semibold text-sky-700 opacity-80 group-hover:opacity-100">
          Open <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
