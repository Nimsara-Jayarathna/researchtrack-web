import type { ReactNode } from "react";
import { LogoMark } from "@/components/brand/Logo";

/** Shared presentation primitives echoing the actual AppShell, PageHeader,
 * PageTabs, stat cards and project panels. These remain static, deliberately
 * anonymized marketing fixtures and never call authenticated APIs. */
export function PreviewWindow({
  children,
  title,
  compact = false,
}: {
  children: ReactNode;
  title: string;
  compact?: boolean;
}) {
  return (
    <div
      className="min-w-0 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_32px_85px_-42px_rgba(4,19,42,.48)]"
      role="img"
      aria-label={`${title} — sample application layout with fictional data`}
    >
      <div className="flex h-10 items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 sm:px-4">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-rose-300" />
          <span className="h-2 w-2 rounded-full bg-amber-300" />
          <span className="h-2 w-2 rounded-full bg-emerald-300" />
        </div>
        <span className="min-w-0 truncate text-[9px] font-semibold uppercase tracking-[.09em] text-slate-500 sm:text-[10px]">
          {title} · Sample preview
        </span>
        <div
          className="h-1.5 w-6 rounded-full bg-slate-200"
          aria-hidden="true"
        />
      </div>
      <div className="flex min-w-0 items-center justify-between border-b border-slate-200 bg-white px-3 py-2 sm:px-5">
        <div className="flex items-center gap-2">
          <LogoMark size={25} />
          <strong className="text-xs tracking-tight text-slate-900">
            ResearchTrack
          </strong>
          <span className="hidden rounded-full bg-indigo-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-indigo-700 sm:inline-flex">
            Supervisor
          </span>
        </div>
        <div className="hidden items-center gap-1 text-[10px] text-slate-500 sm:flex">
          <span className="rounded-lg bg-sky-50 px-2.5 py-1.5 font-semibold text-sky-800 ring-1 ring-inset ring-sky-100">
            Dashboard
          </span>
          <span className="px-2.5 py-1.5">Projects</span>
        </div>
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-800"
          aria-label="Example supervisor profile"
        >
          S
        </span>
      </div>
      <div
        className={
          compact ? "bg-slate-50 p-3 sm:p-4" : "bg-slate-50 p-3 sm:p-5"
        }
      >
        {children}
      </div>
      <div className="border-t border-slate-100 bg-white px-3 py-2 text-[10px] text-slate-500 sm:px-5">
        Illustrative interface · Fictional sample data
      </div>
    </div>
  );
}

export function PreviewCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 ${className}`}
    >
      {children}
    </div>
  );
}

export function PreviewTabs({
  selected,
  tabs,
}: {
  selected: string;
  tabs: readonly string[];
}) {
  return (
    <div
      className="flex min-w-0 flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1.5"
      aria-label="Example application tabs"
    >
      {tabs.map((tab) => (
        <span
          key={tab}
          className={`rounded-lg px-2.5 py-1.5 text-[10px] font-semibold ${tab === selected ? "bg-indigo-50 text-indigo-700" : "text-slate-500"}`}
        >
          {tab}
        </span>
      ))}
    </div>
  );
}

export function PreviewStatus({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const styles = {
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    danger: "border-rose-200 bg-rose-50 text-rose-700",
    info: "border-sky-200 bg-sky-50 text-sky-700",
  } as const;
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-1 text-[10px] font-semibold ${styles[tone]}`}
    >
      {children}
    </span>
  );
}
