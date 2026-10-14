import { ArrowUpRight, CalendarClock } from "lucide-react";
import { Link } from "react-router-dom";
import { WorkspaceNotice } from "@/components/ui/WorkspaceNotice";
import { buttonStyles } from "@/components/ui/Button";
import { UPCOMING_WINDOW_DAYS } from "../../utils/dashboard/constants";
import type { UpcomingMilestoneItem } from "../../utils/dashboard/scoring";
import {
  upcomingWindowClasses,
  upcomingWindowLabel,
} from "../../utils/dashboard/scoring";
import {
  formatMilestoneDate,
  jiraIndicatorLabel,
} from "../../utils/dashboard/presentation";

type DashboardUpcomingMilestonesSectionProps = {
  isLoading: boolean;
  upcomingProjects: UpcomingMilestoneItem[];
  hasConfiguredMilestones?: boolean;
};

export function DashboardUpcomingMilestonesSection({
  isLoading,
  upcomingProjects,
  hasConfiguredMilestones = true,
}: DashboardUpcomingMilestonesSectionProps) {
  return (
    <section
      aria-labelledby="milestone-section-title"
      className="workspace-panel min-w-0 p-4 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
          <CalendarClock aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <h2
            id="milestone-section-title"
            className="text-lg font-semibold tracking-tight text-slate-900"
          >
            Upcoming milestones
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Overdue items and deadlines within {UPCOMING_WINDOW_DAYS} days.
          </p>
        </div>
      </div>
      {isLoading ? (
        <div className="mt-5 space-y-3" aria-label="Loading milestones">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      ) : upcomingProjects.length ? (
        <div className="mt-5 space-y-3">
          {upcomingProjects.map((item) => (
            <article
              key={item.project.id}
              className="rounded-2xl border border-slate-200 bg-slate-50/65 p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
                    {item.project.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatMilestoneDate(item.project.milestoneDate)}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${upcomingWindowClasses(item.daysUntilMilestone)}`}
                >
                  {upcomingWindowLabel(item.daysUntilMilestone)}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600">
                  {item.project.lifecycleStatus.replace("_", " ")}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600">
                  Jira {jiraIndicatorLabel(item.project.jiraHealthIndicator)}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600">
                  {item.project.progressPercent == null
                    ? "Progress not reported"
                    : `${item.project.progressPercent}% reported progress`}
                </span>
              </div>
              <Link
                to={`/supervisor/projects/${item.project.id}`}
                className={buttonStyles({
                  variant: "link",
                  size: "sm",
                  className: "mt-3 inline-flex gap-1 text-xs",
                })}
              >
                Review milestone{" "}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-5">
          {hasConfiguredMilestones ? (
            <WorkspaceNotice
              kind="clear"
              title="No deadlines in the next two weeks"
              description={`No configured milestones are overdue or due within the next ${UPCOMING_WINDOW_DAYS} days.`}
            />
          ) : (
            <WorkspaceNotice
              kind="unconfigured"
              title="No milestones configured"
              description="Set a milestone on a project to begin tracking approaching deadlines here."
            />
          )}
        </div>
      )}
    </section>
  );
}
