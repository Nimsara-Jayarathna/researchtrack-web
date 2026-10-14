import type { ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CircleAlert,
  FolderKanban,
  GitBranch,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/cn";

type DashboardStatTone =
  "primary" | "success" | "info" | "warning" | "danger" | "neutral";
type MetricIcon =
  | "total"
  | "active"
  | "risk"
  | "behind"
  | "milestone"
  | "jiraRisk"
  | "jiraBehind";

const TONE_STYLES: Record<
  DashboardStatTone,
  { value: string; accent: string; icon: string }
> = {
  neutral: {
    value: "text-slate-500",
    accent: "bg-slate-200",
    icon: "bg-slate-100 text-slate-500",
  },
  primary: {
    value: "text-slate-900",
    accent: "bg-sky-500",
    icon: "bg-sky-50 text-sky-700",
  },
  success: {
    value: "text-emerald-700",
    accent: "bg-emerald-400",
    icon: "bg-emerald-50 text-emerald-700",
  },
  info: {
    value: "text-sky-700",
    accent: "bg-sky-400",
    icon: "bg-sky-50 text-sky-700",
  },
  warning: {
    value: "text-amber-700",
    accent: "bg-amber-400",
    icon: "bg-amber-50 text-amber-700",
  },
  danger: {
    value: "text-rose-700",
    accent: "bg-rose-400",
    icon: "bg-rose-50 text-rose-700",
  },
};
const ICONS = {
  total: FolderKanban,
  active: Activity,
  risk: AlertTriangle,
  behind: CircleAlert,
  milestone: CalendarClock,
  jiraRisk: GitBranch,
  jiraBehind: ShieldCheck,
};

export type DashboardStatCardProps = {
  label: string;
  value?: ReactNode;
  tone: DashboardStatTone;
  icon?: MetricIcon;
  compact?: boolean;
  loading?: boolean;
  /** Small-scale rendering inside the public sample preview. Same surface and accent. */
  preview?: boolean;
};

export function DashboardStatCard({
  label,
  value,
  tone,
  icon = "total",
  compact = false,
  loading = false,
  preview = false,
}: DashboardStatCardProps) {
  const styles = TONE_STYLES[tone];
  const Icon = ICONS[icon];
  return (
    <div
      className={cn(
        "relative flex min-w-0 flex-col overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.035),0_10px_30px_rgba(15,23,42,0.018)]",
        preview ? "min-h-[86px] rounded-xl p-2.5 sm:p-3" : "p-3.5 sm:p-4",
        preview ? "" : compact ? "min-h-[104px]" : "min-h-[120px]",
        loading && "animate-pulse",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-x-4 top-0 h-[3px] rounded-b-full opacity-90",
          styles.accent,
        )}
      />
      <div className="flex min-w-0 items-start justify-between gap-2">
        <p
          className={
            preview
              ? "max-w-full text-[9px] font-semibold leading-4 text-slate-500"
              : "max-w-full text-xs font-semibold leading-5 text-slate-500"
          }
        >
          {loading ? (
            <span className="block h-3 w-20 rounded bg-slate-100" />
          ) : (
            label
          )}
        </p>
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg",
            preview ? "h-6 w-6" : "h-8 w-8",
            styles.icon,
          )}
        >
          <Icon
            aria-hidden="true"
            className={preview ? "h-3.5 w-3.5" : "h-4 w-4"}
          />
        </span>
      </div>
      <div
        className={cn(
          "mt-auto font-semibold leading-none tracking-tight tabular-nums",
          preview
            ? "text-lg sm:text-xl"
            : compact
              ? "text-2xl"
              : "text-3xl sm:text-[30px]",
          styles.value,
        )}
      >
        {loading ? (
          <span className="block h-8 w-12 rounded bg-slate-100" />
        ) : (
          (value ?? 0)
        )}
      </div>
    </div>
  );
}
