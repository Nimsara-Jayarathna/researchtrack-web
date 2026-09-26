import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type IntegrationEmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

export function IntegrationEmptyState({
  icon,
  title,
  description,
  action,
  className,
}: IntegrationEmptyStateProps) {
  return (
    <section
      className={cn(
        "flex min-h-[17.5rem] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center sm:px-10 sm:py-12",
        className,
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-100">
        {icon}
      </div>
      <h2 className="mt-6 text-lg font-bold text-slate-800">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </section>
  );
}
