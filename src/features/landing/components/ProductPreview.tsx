import { AlertTriangle, ArrowRight, CalendarDays, Search } from "lucide-react";
import { PreviewCard, PreviewStatus, PreviewWindow } from "./AppPreviewUI";

const stats = [
  { label: "Total projects", value: "08", tone: "border-sky-300 text-sky-700" },
  { label: "Active", value: "06", tone: "border-emerald-300 text-emerald-700" },
  { label: "At risk", value: "01", tone: "border-amber-300 text-amber-700" },
  { label: "Behind", value: "01", tone: "border-rose-300 text-rose-700" },
  { label: "Upcoming milestones", value: "05", tone: "border-sky-300 text-sky-700" },
  { label: "Jira at risk", value: "01", tone: "border-amber-300 text-amber-700" },
  { label: "Jira behind", value: "00", tone: "border-rose-300 text-rose-700" },
] as const;

const projects = [
  { title: "Project Atlas", status: "AT RISK", progress: "64%", milestone: "Proposal review", health: "At risk", tone: "warning" as const },
  { title: "Project Horizon", status: "ACTIVE", progress: "78%", milestone: "Implementation", health: "On track", tone: "success" as const },
];

/** Mirrors the sections actually present in SupervisorDashboardPage:
 * DashboardStatsSection (7 metrics), ProjectHealthSection, AttentionSection
 * and UpcomingMilestonesSection. No production data or network access. */
export function ProductPreview() {
  return <PreviewWindow title="Supervisor dashboard">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-base font-semibold text-slate-950 sm:text-xl">Supervisor Dashboard</h3><p className="mt-1 text-[11px] text-slate-500 sm:text-xs">Monitor delivery health across every supervised project.</p></div><div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] text-slate-400"><Search size={13} aria-hidden="true"/> Search projects</div></div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{stats.map(({ label, value, tone }) => <div key={label} className={`rounded-xl border border-l-[3px] bg-white p-2.5 shadow-sm sm:p-3 ${tone.split(' ')[0]}`}><p className="min-h-[24px] text-[9px] font-medium uppercase leading-3 tracking-wide text-slate-500">{label}</p><p className={`mt-2 text-xl font-semibold ${tone.split(' ')[1]}`}>{value}</p></div>)}</div>
    <PreviewCard className="mt-3"><div className="mb-3 flex items-center justify-between gap-2"><div><h4 className="text-xs font-semibold text-slate-900 sm:text-sm">Project health</h4><p className="mt-0.5 text-[10px] text-slate-500">Searchable overview with links into project workspaces.</p></div><span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-700">View all <ArrowRight size={12} aria-hidden="true"/></span></div>
      <div className="overflow-hidden rounded-xl border border-slate-200"><div className="hidden grid-cols-[2fr_1fr_1fr_1.3fr_1fr] border-b border-slate-100 bg-slate-50 px-3 py-2 text-[9px] font-bold uppercase tracking-wide text-slate-500 sm:grid"><span>Project</span><span>Status</span><span>Progress</span><span>Milestone</span><span>Jira health</span></div>{projects.map(project => <div key={project.title} className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-white px-3 py-3 last:border-b-0 sm:grid sm:grid-cols-[2fr_1fr_1fr_1.3fr_1fr] sm:gap-1"><span className="min-w-[105px] flex-1 text-[11px] font-semibold text-slate-900 sm:min-w-0 sm:flex-none">{project.title}</span><span className="text-[10px] font-semibold text-slate-600">{project.status}</span><span className="text-[10px] font-bold text-slate-700">{project.progress}</span><span className="hidden text-[10px] text-slate-500 sm:block">{project.milestone}</span><PreviewStatus tone={project.tone}>{project.health}</PreviewStatus></div>)}</div>
    </PreviewCard>
    <div className="mt-3 grid gap-3 md:grid-cols-2">
      <PreviewCard><div className="mb-2 flex items-center gap-2"><AlertTriangle size={15} className="text-amber-600" aria-hidden="true"/><h4 className="text-xs font-semibold text-slate-900">Projects needing attention</h4></div><div className="flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50/65 p-3"><div><p className="text-[11px] font-semibold text-slate-800">Project Atlas</p><p className="mt-0.5 text-[10px] text-slate-500">Milestone approaching · check progress</p></div><PreviewStatus tone="warning">Review</PreviewStatus></div></PreviewCard>
      <PreviewCard><div className="mb-2 flex items-center gap-2"><CalendarDays size={15} className="text-sky-600" aria-hidden="true"/><h4 className="text-xs font-semibold text-slate-900">Upcoming milestones</h4></div><div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"><div><p className="text-[11px] font-semibold text-slate-800">Implementation checkpoint</p><p className="mt-0.5 text-[10px] text-slate-500">Project Horizon</p></div><PreviewStatus tone="info">Due soon</PreviewStatus></div></PreviewCard>
    </div>
  </PreviewWindow>;
}
