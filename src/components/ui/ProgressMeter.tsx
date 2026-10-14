import { cn } from "@/lib/cn";

type ProgressMeterProps = {
  value: number | null | undefined;
  label?: string;
  className?: string;
  compact?: boolean;
};

/** Presentation only: do not infer lifecycle health from completion percentage. */
export function ProgressMeter({
  value,
  label = "Reported progress",
  className,
  compact = false,
}: ProgressMeterProps) {
  const hasValue = typeof value === "number" && Number.isFinite(value);
  const progress = hasValue ? Math.min(100, Math.max(0, value)) : 0;
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-center justify-between gap-3">
        {!compact ? (
          <span className="text-xs font-medium text-slate-500">{label}</span>
        ) : null}
        <span className="text-xs font-semibold tabular-nums text-slate-800">
          {hasValue ? `${value}%` : "Not reported"}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={hasValue ? progress : undefined}
        aria-valuetext={hasValue ? `${value}% reported` : "Not reported"}
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className="h-full rounded-full bg-sky-500 transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
