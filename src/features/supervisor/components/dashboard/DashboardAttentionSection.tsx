import { AlertTriangle, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { WorkspaceNotice } from "@/components/ui/WorkspaceNotice";
import { buttonStyles } from "@/components/ui/Button";
import {
  upcomingWindowLabel,
  type AttentionItem,
} from "../../utils/dashboard/scoring";
import { jiraIndicatorLabel } from "../../utils/dashboard/presentation";

type DashboardAttentionSectionProps = {
  isLoading: boolean;
  attentionProjects: AttentionItem[];
};

export function DashboardAttentionSection({
  isLoading,
  attentionProjects,
}: DashboardAttentionSectionProps) {
  return (
    <section
      aria-labelledby="attention-title"
      className="workspace-panel min-w-0 p-4 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
          <AlertTriangle aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <h2
            id="attention-title"
            className="text-lg font-semibold tracking-tight text-slate-900"
          >
            Projects needing attention
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Prioritized by lifecycle, Jira, milestones, and activity.
          </p>
        </div>
      </div>
      {isLoading ? (
        <div className="mt-5 space-y-3" aria-label="Loading attention items">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      ) : attentionProjects.length ? (
        <div className="mt-5 space-y-3">
          {attentionProjects.map((item) => (
            <article
              key={item.project.id}
              className={`rounded-2xl border p-4 sm:p-5 ${item.severity === "critical" ? "border-rose-200 bg-rose-50/50" : "border-amber-200 bg-amber-50/50"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="min-w-0 text-base font-semibold text-slate-900">
                  {item.project.title}
                </h3>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${item.severity === "critical" ? "border-rose-200 bg-rose-100 text-rose-700" : "border-amber-200 bg-amber-100 text-amber-700"}`}
                >
                  {item.severity === "critical" ? "Critical" : "Needs review"}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {item.summaryText}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  {item.project.lifecycleStatus.replace("_", " ")}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  Jira {jiraIndicatorLabel(item.project.jiraHealthIndicator)}
                </span>
                {item.daysUntilMilestone !== null ? (
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
                    {upcomingWindowLabel(item.daysUntilMilestone)}
                  </span>
                ) : null}
                {item.inactivityDays !== null ? (
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
                    {item.inactivityDays}d since activity
                  </span>
                ) : null}
              </div>
              {item.reasons.length ? (
                <div className="mt-3 border-t border-slate-200/80 pt-3">
                  <p className="text-xs font-semibold text-slate-700">
                    Why this needs attention
                  </p>
                  <ul className="mt-1 list-inside list-disc space-y-1 text-xs leading-5 text-slate-600">
                    {item.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <Link
                to={`/supervisor/projects/${item.project.id}`}
                className={buttonStyles({
                  variant: "link",
                  size: "sm",
                  className: "mt-3 inline-flex gap-1 text-xs",
                })}
              >
                Open project{" "}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-5">
          <WorkspaceNotice
            kind="clear"
            title="No urgent reviews right now"
            description="None of the current projects meet the dashboard's attention threshold."
          />
        </div>
      )}
    </section>
  );
}
