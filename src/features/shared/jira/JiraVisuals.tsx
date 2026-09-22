import type { ReactNode } from "react";

export type MetricTone = "neutral" | "todo" | "active" | "warning" | "done";

const metricTones: Record<MetricTone, string> = {
  neutral: "border-slate-200 bg-white",
  todo: "border-sky-200 bg-sky-50/60",
  active: "border-blue-200 bg-blue-50/60",
  warning: "border-amber-200 bg-amber-50/70",
  done: "border-emerald-200 bg-emerald-50/60",
};
const metricValues: Record<MetricTone, string> = {
  neutral: "text-slate-900",
  todo: "text-sky-800",
  active: "text-blue-800",
  warning: "text-amber-900",
  done: "text-emerald-800",
};

export function JiraMetricCard({
  label,
  value,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: ReactNode;
  tone?: MetricTone;
  icon?: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-center transition ${metricTones[tone]}`}
    >
      <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-600">
        {icon}
        {label}
      </div>
      <div className={`mt-1 text-2xl font-semibold ${metricValues[tone]}`}>
        {value}
      </div>
    </div>
  );
}

const contributorPalette = [
  "bg-violet-100 text-violet-700 ring-violet-200",
  "bg-sky-100 text-sky-700 ring-sky-200",
  "bg-emerald-100 text-emerald-700 ring-emerald-200",
  "bg-amber-100 text-amber-800 ring-amber-200",
  "bg-rose-100 text-rose-700 ring-rose-200",
  "bg-indigo-100 text-indigo-700 ring-indigo-200",
  "bg-cyan-100 text-cyan-800 ring-cyan-200",
  "bg-fuchsia-100 text-fuchsia-700 ring-fuchsia-200",
];
export function hashJiraIdentity(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i++)
    h = ((h << 5) - h + value.charCodeAt(i)) | 0;
  return Math.abs(h);
}
export function jiraInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (
    parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`
      : parts[0]?.slice(0, 2) || "?"
  ).toUpperCase();
}
export function JiraContributorIdentity({
  accountId,
  displayName,
  compact = false,
}: {
  accountId?: string | null;
  displayName?: string | null;
  compact?: boolean;
}) {
  const name = displayName?.trim() || "Unassigned";
  const assigned = !!displayName;
  const tone = assigned
    ? contributorPalette[
        hashJiraIdentity(
          (accountId?.trim() || name).toLocaleLowerCase(),
        ) % contributorPalette.length
      ]
    : "bg-slate-100 text-slate-500 ring-slate-200";
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span
        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ring-1 ${tone}`}
      >
        {assigned ? jiraInitials(name) : "—"}
      </span>
      {!compact ? (
        <span className="truncate text-sm text-slate-700">{name}</span>
      ) : null}
    </span>
  );
}
