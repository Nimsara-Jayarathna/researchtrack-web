import { Activity, AlertCircle, CalendarClock, Check, ChevronRight, CircleDot, GitBranch, LayoutDashboard, ListTodo, MessageSquareText, PanelsTopLeft, Search, ShieldCheck } from "lucide-react";

/** Static, illustrative composition of existing supervisor-dashboard concepts.
 * All names and values are fictional sample data. Not a live API response. */
export function ProductPreview({ compact = false }: { compact?: boolean }) {
  return (
    <div className="relative rounded-[23px] border border-slate-200/80 bg-white p-1.5 shadow-[0_32px_95px_-34px_rgba(7,23,53,0.36)] sm:p-2" aria-label="Illustrative ResearchTrack supervisor workspace with sample project health and activity">
      <div className="flex items-center justify-between rounded-t-[17px] border-b border-slate-100 bg-slate-50 px-3 py-2.5 sm:px-4">
        <div className="flex gap-1.5" aria-hidden="true"><span className="h-2 w-2 rounded-full bg-rose-300" /><span className="h-2 w-2 rounded-full bg-amber-300" /><span className="h-2 w-2 rounded-full bg-emerald-300" /></div>
        <span className="text-[9px] font-medium tracking-wide text-slate-500 sm:text-[10px]">SUPERVISOR WORKSPACE · ILLUSTRATIVE</span>
        <div className="h-2 w-7 rounded bg-slate-200" />
      </div>
      <div className="flex min-h-[320px] overflow-hidden rounded-b-[17px] bg-white sm:min-h-[355px]">
        <aside className="hidden w-[158px] shrink-0 border-r border-slate-100 bg-slate-950 px-3 py-5 text-slate-300 md:block" aria-hidden="true">
          <div className="mb-8 flex items-center gap-2 text-xs font-bold text-white"><span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500 text-[11px]">R</span> ResearchTrack</div>
          <div className="space-y-1.5 text-[10px]"><div className="flex items-center gap-2 rounded-md bg-slate-800 px-2 py-2 text-white"><LayoutDashboard size={12}/> Overview</div><div className="flex items-center gap-2 px-2 py-2"><PanelsTopLeft size={12}/> Projects</div><div className="flex items-center gap-2 px-2 py-2"><GitBranch size={12}/> Integrations</div><div className="flex items-center gap-2 px-2 py-2"><CalendarClock size={12}/> Milestones</div></div>
          <div className="mt-16 border-t border-slate-800 pt-4 text-[10px] text-slate-400">Academic workspace</div>
        </aside>
        <div className="min-w-0 flex-1 px-3 py-4 sm:px-5 sm:py-5">
          <div className="mb-5 flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-700">Portfolio overview</p><h3 className="mt-1 text-base font-bold tracking-tight text-slate-900 sm:text-lg">Good morning, Supervisor</h3><p className="mt-1 text-[10px] text-slate-500 sm:text-xs">Focus on the research work that needs your attention.</p></div><Search size={17} className="hidden shrink-0 text-slate-400 sm:block" aria-hidden="true" /></div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: "Active projects", value: "08", icon: Activity, accent: "text-sky-600 bg-sky-50" },
              { label: "Need attention", value: "02", icon: AlertCircle, accent: "text-amber-700 bg-amber-50" },
              { label: "Upcoming milestones", value: "05", icon: CalendarClock, accent: "text-violet-600 bg-violet-50" },
            ].map(({ label, value, icon: Icon, accent }) => <div key={label} className="rounded-xl border border-slate-200 p-2.5 sm:p-3"><div className={`mb-2 flex h-7 w-7 items-center justify-center rounded-lg ${accent}`}><Icon size={14} aria-hidden="true" /></div><p className="text-lg font-bold leading-none text-slate-900 sm:text-xl">{value}</p><p className="mt-1.5 text-[9px] leading-3 text-slate-500 sm:text-[10px]">{label}</p></div>)}
          </div>
          <div className={`mt-3 grid gap-3 ${compact ? "" : "lg:grid-cols-[1.4fr_1fr]"}`}>
            <div className="rounded-xl border border-slate-200 p-3 sm:p-4"><div className="mb-3 flex items-center justify-between gap-2"><h4 className="text-[11px] font-semibold text-slate-900 sm:text-xs">Projects needing attention</h4><ChevronRight size={13} className="text-slate-400" aria-hidden="true"/></div><div className="rounded-lg border border-amber-100 bg-amber-50/70 p-2.5"><div className="flex items-center justify-between gap-2"><span className="truncate text-[10px] font-bold text-slate-800">Project Atlas</span><span className="shrink-0 rounded-md bg-amber-100 px-1.5 py-1 text-[9px] font-semibold text-amber-800">Review</span></div><p className="mt-1 text-[9px] text-slate-600">Milestone approaching · Check progress</p></div><div className="mt-2 flex items-center justify-between rounded-lg border border-slate-100 p-2.5"><div className="min-w-0"><p className="truncate text-[10px] font-semibold text-slate-800">Project Horizon</p><p className="mt-1 text-[9px] text-slate-500">Development activity available</p></div><span className="ml-1 shrink-0 rounded-md bg-emerald-50 px-1.5 py-1 text-[9px] font-semibold text-emerald-700">Active</span></div></div>
            {!compact && <div className="hidden rounded-xl border border-slate-200 p-3 sm:p-4 lg:block"><h4 className="mb-4 text-xs font-semibold text-slate-900">In one workspace</h4><div className="space-y-4">{[{ icon: GitBranch, label: "GitHub activity" }, { icon: ListTodo, label: "Jira progress" }, { icon: MessageSquareText, label: "Meeting records" }, { icon: ShieldCheck, label: "Submission reviews" }].map(({icon: Icon,label}) => <div key={label} className="flex items-center gap-2 text-[11px] text-slate-600"><span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-700"><Icon size={12} aria-hidden="true"/></span>{label}<Check size={12} className="ml-auto text-emerald-600" aria-hidden="true"/></div>)}</div></div>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 bg-white px-2 py-2 text-[10px] text-slate-500 sm:px-3"><CircleDot size={11} className="text-sky-600" aria-hidden="true"/> Concept preview based on existing workflows · Fictional sample data</div>
    </div>
  );
}
