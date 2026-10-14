import { AlertTriangle, ArrowRight, CalendarDays, Search } from "lucide-react";
import { DashboardStatCard } from "@/components/ui/DashboardStatCard";
import { PreviewCard, PreviewStatus, PreviewWindow } from "./AppPreviewUI";

const stats = [
  { label: "Total projects", value: "08", tone: "primary", icon: "total" },
  { label: "Active", value: "06", tone: "success", icon: "active" },
  { label: "At risk", value: "01", tone: "warning", icon: "risk" },
  { label: "Behind", value: "01", tone: "danger", icon: "behind" },
  {
    label: "Upcoming milestones",
    value: "05",
    tone: "info",
    icon: "milestone",
  },
  { label: "Jira at risk", value: "01", tone: "warning", icon: "jiraRisk" },
  { label: "Jira behind", value: "00", tone: "danger", icon: "jiraBehind" },
] as const;

const projects = [
  {
    title: "Project Atlas",
    status: "AT RISK",
    progress: "64%",
    members: "4",
    milestone: "Proposal review",
    health: "At risk",
    tone: "warning" as const,
  },
  {
    title: "Project Horizon",
    status: "ACTIVE",
    progress: "78%",
    members: "3",
    milestone: "Implementation",
    health: "On track",
    tone: "success" as const,
  },
];

/** Mirrors the sections actually present in SupervisorDashboardPage:
 * DashboardStatsSection (7 metrics), ProjectHealthSection, AttentionSection
 * and UpcomingMilestonesSection. No production data or network access. */
export function ProductPreview() {
  return (
    <PreviewWindow title="Supervisor dashboard">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950 sm:text-xl">
            Supervisor Dashboard
          </h3>
          <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">
            Monitor delivery health across every supervised project.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] text-slate-400">
          <Search size={13} aria-hidden="true" /> Search projects
        </div>
      </div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="text-[11px] font-semibold text-slate-900">
          Portfolio overview
        </h4>
        <span className="text-[9px] text-slate-500">
          Delivery &amp; Jira signals
        </span>
      </div>
      <div
        className="grid gap-2 lg:grid-cols-7"
        data-testid="marketing-portfolio-metrics"
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:contents">
          {stats.slice(0, 4).map((stat) => (
            <DashboardStatCard key={stat.label} {...stat} preview />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:contents">
          {stats.slice(4).map((stat) => (
            <DashboardStatCard key={stat.label} {...stat} compact preview />
          ))}
        </div>
      </div>
      <PreviewCard className="mt-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-semibold text-slate-900 sm:text-sm">
              Project health
            </h4>
            <p className="mt-0.5 text-[10px] text-slate-500">
              Searchable overview with links into project workspaces.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-700">
            View all <ArrowRight size={12} aria-hidden="true" />
          </span>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="hidden grid-cols-[1.8fr_1fr_.55fr_1.2fr_1fr_1fr_.65fr] border-b border-slate-100 bg-slate-50 px-3 py-2 text-[9px] font-bold uppercase tracking-wide text-slate-500 sm:grid">
            <span>Project</span>
            <span>Status</span>
            <span>Members</span>
            <span>Milestone</span>
            <span>Progress</span>
            <span>Jira health</span>
            <span>Open</span>
          </div>
          {projects.map((project) => (
            <div
              key={project.title}
              className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-white px-3 py-3 last:border-b-0 sm:grid sm:grid-cols-[1.8fr_1fr_.55fr_1.2fr_1fr_1fr_.65fr] sm:gap-1"
            >
              <span className="min-w-[105px] flex-1 text-[11px] font-semibold text-slate-900 sm:min-w-0 sm:flex-none">
                {project.title}
              </span>
              <span className="text-[10px] font-semibold text-slate-600">
                {project.status}
              </span>
              <span className="hidden text-[10px] text-slate-500 sm:block">
                {project.members}
              </span>
              <span className="hidden text-[10px] text-slate-500 sm:block">
                {project.milestone}
              </span>
              <span className="flex min-w-0 flex-col gap-1 text-[10px] font-bold text-slate-700">
                {project.progress}
                <span className="hidden h-1.5 w-full rounded-full bg-slate-100 sm:block">
                  <span
                    className="block h-full rounded-full bg-sky-500"
                    style={{ width: project.progress }}
                  />
                </span>
              </span>
              <PreviewStatus tone={project.tone}>
                {project.health}
              </PreviewStatus>
              <span className="hidden rounded-md bg-slate-900 px-1.5 py-1 text-center text-[9px] font-semibold text-white sm:block">
                Open
              </span>
            </div>
          ))}
        </div>
      </PreviewCard>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <PreviewCard>
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle
              size={15}
              className="text-amber-600"
              aria-hidden="true"
            />
            <h4 className="text-xs font-semibold text-slate-900">
              Projects needing attention
            </h4>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50/65 p-3">
            <div>
              <p className="text-[11px] font-semibold text-slate-800">
                Project Atlas
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">
                Milestone approaching · check progress
              </p>
            </div>
            <PreviewStatus tone="warning">Review</PreviewStatus>
          </div>
        </PreviewCard>
        <PreviewCard>
          <div className="mb-2 flex items-center gap-2">
            <CalendarDays
              size={15}
              className="text-sky-600"
              aria-hidden="true"
            />
            <h4 className="text-xs font-semibold text-slate-900">
              Upcoming milestones
            </h4>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div>
              <p className="text-[11px] font-semibold text-slate-800">
                Implementation checkpoint
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">
                Project Horizon
              </p>
            </div>
            <PreviewStatus tone="info">Due soon</PreviewStatus>
          </div>
        </PreviewCard>
      </div>
    </PreviewWindow>
  );
}
