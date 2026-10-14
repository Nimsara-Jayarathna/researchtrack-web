import { CheckCircle2, CalendarClock, Info } from "lucide-react";
import type { ReactNode } from "react";

type WorkspaceNoticeProps = {
  kind?: "clear" | "unconfigured" | "neutral";
  title: string;
  description: string;
  action?: ReactNode;
};

/** Shared, informative empty state for authenticated workspaces. */
export function WorkspaceNotice({
  kind = "neutral",
  title,
  description,
  action,
}: WorkspaceNoticeProps) {
  const Icon =
    kind === "clear"
      ? CheckCircle2
      : kind === "unconfigured"
        ? CalendarClock
        : Info;
  const color =
    kind === "clear"
      ? "text-emerald-600 bg-emerald-50"
      : "text-sky-700 bg-sky-50";
  return (
    <div className="flex min-h-44 flex-col items-start justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-5 sm:p-6">
      <span
        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-3 text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 max-w-md text-sm leading-6 text-slate-600">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
