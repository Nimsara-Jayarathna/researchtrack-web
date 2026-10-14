import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type SectionCardProps = {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function SectionCard({
  title,
  subtitle,
  actions,
  children,
  className,
}: SectionCardProps) {
  return (
    <section className={cn("workspace-panel p-4 sm:p-6", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            {title}
          </h2>
          {subtitle ? (
            <div className="mt-1 text-sm leading-6 text-slate-500">
              {subtitle}
            </div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex items-center gap-2">{actions}</div>
        ) : null}
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}
