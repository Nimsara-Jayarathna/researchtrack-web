import { CalendarDays, CircleAlert, ListTodo } from "lucide-react";
import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { parseLocalDateOnly } from "@/lib/dateOnly";
import type { StudentProjectSummary } from "../types";

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

type StudentProjectCardProps = {
  project: StudentProjectSummary;
};

function statusTone(status: StudentProjectSummary["status"]) {
  if (status === "ACTIVE") return "success";
  if (status === "AT_RISK") return "warning";
  if (status === "BEHIND") return "danger";
  if (status === "COMPLETED") return "neutral";
  return "student";
}

export function StudentProjectCard({ project }: StudentProjectCardProps) {
  const progressValue =
    typeof project.progressPercent === "number"
      ? `${project.progressPercent}%`
      : "-";
  const title = project.title;
  const summary = project.summary ?? "No summary has been added yet.";
  const supervisorName = project.supervisorName ?? "Not available";
  const batch = project.batch ?? "Batch N/A";
  const semester = project.semester ?? "Semester N/A";

  const milestoneLabel = project.milestoneDate
    ? (() => {
        const milestoneDate = parseLocalDateOnly(project.milestoneDate);
        return `Milestone ${
          milestoneDate
            ? dateFormatter.format(milestoneDate)
            : project.milestoneDate
        }`;
      })()
    : "Milestone not set";

  const activityLabel = project.lastActivityAt
    ? `Updated ${dateFormatter.format(new Date(project.lastActivityAt))}`
    : "No activity yet";

  return (
    <Link
      to={`/student/projects/${project.id}`}
      className="group flex h-full min-w-0 flex-col rounded-3xl border border-border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-200"
    >
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <h3
          className="min-w-0 truncate text-lg font-semibold text-foreground"
          title={title}
        >
          {title}
        </h3>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge
            tone={statusTone(project.status)}
            className="shrink-0 whitespace-nowrap tracking-[0.08em]"
          >
            {project.status.replace("_", " ")}
          </StatusBadge>
          <span className="inline-flex shrink-0 whitespace-nowrap rounded-2xl bg-slate-50 px-2.5 py-1 text-sm font-semibold text-foreground">
            {progressValue}
          </span>
        </div>
      </div>

      <p
        className="mt-2 min-h-[2.7rem] overflow-hidden text-sm leading-[1.35rem] text-muted-foreground"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
        title={summary}
      >
        {summary}
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(7rem,0.7fr)]">
        <div className="flex min-h-14 min-w-0 flex-col justify-center rounded-2xl bg-slate-50 px-3 py-2">
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Supervisor
          </p>
          <p
            className="mt-0.5 truncate text-[15px] font-semibold text-foreground"
            title={supervisorName}
          >
            {supervisorName}
          </p>
        </div>
        <div className="flex min-h-14 min-w-0 flex-col justify-center rounded-2xl bg-slate-50 px-3 py-2">
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

      <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
        <span
          className="inline-flex min-w-0 items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2"
          title={milestoneLabel}
        >
          <CalendarDays className="h-4 w-4 shrink-0" />
          <span className="truncate">{milestoneLabel}</span>
        </span>
        <span
          className="inline-flex min-w-0 items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2"
          title={semester}
        >
          <ListTodo className="h-4 w-4 shrink-0" />
          <span className="truncate">{semester}</span>
        </span>
        <span
          className="inline-flex min-w-0 items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 sm:col-span-2"
          title={activityLabel}
        >
          <CircleAlert className="h-4 w-4 shrink-0" />
          <span className="truncate">{activityLabel}</span>
        </span>
      </div>
    </Link>
  );
}
