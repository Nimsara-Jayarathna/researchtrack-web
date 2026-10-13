import {
  CalendarDays,
  CheckCircle2,
  FileCheck2,
  Github,
  GitPullRequest,
  MessageSquareText,
  Users,
} from "lucide-react";
import {
  PreviewCard,
  PreviewStatus,
  PreviewTabs,
  PreviewWindow,
} from "./AppPreviewUI";

/** Derives the presentation from ProjectDetailsPage, ProjectHeroCard,
 * PageTabs, ProjectOverviewContent and MilestonesTabSection. */
export function ProjectJourneyPreview() {
  return (
    <PreviewWindow title="Project workspace">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">
            Project Horizon
          </h3>
          <p className="mt-1 text-[11px] leading-5 text-slate-500">
            A shared view of research delivery, team activity, and submissions.
          </p>
        </div>
        <PreviewStatus tone="success">IN PROGRESS</PreviewStatus>
      </div>
      <div className="my-3 grid grid-cols-3 gap-2">
        {[
          { icon: CalendarDays, label: "Milestones", value: "3 defined" },
          { icon: Users, label: "Team", value: "4 members" },
          { icon: CheckCircle2, label: "Progress", value: "67%" },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 sm:p-3"
          >
            <span className="hidden rounded-lg bg-indigo-50 p-1.5 text-indigo-600 sm:inline-flex">
              <Icon size={14} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-wide text-slate-500">
                {label}
              </p>
              <p className="truncate text-[11px] font-semibold text-slate-800">
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>
      <PreviewTabs
        selected="Overview"
        tabs={[
          "Overview",
          "Team",
          "Milestones",
          "Submissions",
          "Integrations",
          "GitHub",
          "Jira",
          "Meetings",
        ]}
      />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <PreviewCard>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-900">
              Project Milestones
            </h4>
            <PreviewStatus tone="info">Due soon: 1</PreviewStatus>
          </div>
          <div className="space-y-3">
            {[
              {
                label: "Research proposal",
                tone: "success" as const,
                status: "COMPLETED",
              },
              {
                label: "Implementation",
                tone: "info" as const,
                status: "IN PROGRESS",
              },
              {
                label: "Final review",
                tone: "neutral" as const,
                status: "PLANNED",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-1 border-b border-slate-100 pb-2 last:border-0"
              >
                <span className="min-w-0 truncate text-[11px] text-slate-700">
                  {item.label}
                </span>
                <PreviewStatus tone={item.tone}>{item.status}</PreviewStatus>
              </div>
            ))}
          </div>
        </PreviewCard>
        <PreviewCard>
          <h4 className="text-xs font-semibold text-slate-900">
            Project connections
          </h4>
          <div className="mt-3 space-y-2.5">
            {[
              {
                icon: Github,
                label: "GitHub",
                value: "2 repositories",
                tone: "success" as const,
              },
              {
                icon: GitPullRequest,
                label: "Jira",
                value: "Sprint work linked",
                tone: "info" as const,
              },
            ].map(({ icon: Icon, label, value, tone }) => (
              <div
                key={label}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <span className="flex items-center gap-2 text-[11px] font-semibold text-slate-700">
                  <Icon size={14} aria-hidden="true" />
                  {label}
                </span>
                <PreviewStatus tone={tone}>{value}</PreviewStatus>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] leading-5 text-slate-500">
            Contribution and issue analytics are available in their dedicated
            project tabs.
          </p>
        </PreviewCard>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <PreviewCard className="flex items-center gap-2.5">
          <MessageSquareText
            className="shrink-0 text-amber-700"
            size={18}
            aria-hidden="true"
          />
          <div>
            <p className="text-[11px] font-semibold text-slate-900">
              Meeting records
            </p>
            <p className="text-[10px] text-slate-500">
              Supervisor approvals and history
            </p>
          </div>
        </PreviewCard>
        <PreviewCard className="flex items-center gap-2.5">
          <FileCheck2
            className="shrink-0 text-emerald-700"
            size={18}
            aria-hidden="true"
          />
          <div>
            <p className="text-[11px] font-semibold text-slate-900">
              Research submissions
            </p>
            <p className="text-[10px] text-slate-500">
              Requirements, reviews and revisions
            </p>
          </div>
        </PreviewCard>
      </div>
    </PreviewWindow>
  );
}
