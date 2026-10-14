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

type DashboardStatTone = "primary" | "success" | "info" | "warning" | "danger";
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
};

export function DashboardStatCard({
  label,
  value,
  tone,
  icon = "total",
  compact = false,
  loading = false,
}: DashboardStatCardProps) {
  const styles = TONE_STYLES[tone];
  const Icon = ICONS[icon];
  return (
    <div
      className={cn(
        "workspace-panel relative flex min-w-0 flex-col overflow-hidden p-4 sm:p-5",
        compact ? "min-h-[104px]" : "min-h-[138px]",
        loading && "animate-pulse",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-x-5 top-0 h-[3px] rounded-b-full opacity-90",
          styles.accent,
        )}
      />
      <div className="flex min-w-0 items-start justify-between gap-2">
        <p className="max-w-full text-xs font-semibold leading-5 text-slate-500">
          {loading ? (
            <span className="block h-3 w-20 rounded bg-slate-100" />
          ) : (
            label
          )}
        </p>
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            styles.icon,
          )}
        >
          <Icon aria-hidden="true" className="h-4 w-4" />
        </span>
      </div>
      <div
        className={cn(
          "mt-auto font-semibold leading-none tracking-tight tabular-nums",
          compact ? "text-2xl" : "text-3xl sm:text-[34px]",
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
