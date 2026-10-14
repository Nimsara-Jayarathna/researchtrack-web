import type { ReactNode } from "react";

type ProjectHeroCardProps = {
  title: string;
  subtitle: string;
  rightSlot: ReactNode;
  kpiSlot: ReactNode;
  rootClassName?: string;
};

export function ProjectHeroCard({
  title,
  subtitle,
  rightSlot,
  kpiSlot,
  rootClassName,
}: ProjectHeroCardProps) {
  return (
    <section className={rootClassName ?? "workspace-panel p-4 sm:p-6"}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold tracking-[-0.035em] text-slate-950 sm:text-[30px] lg:text-[34px]">
            {title}
          </h1>
          <p
            className="mt-1.5 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {subtitle}
          </p>
        </div>

        <div className="shrink-0 self-start lg:self-auto">{rightSlot}</div>
      </div>

      <div className="mt-6 h-px w-full bg-slate-100" />

      <div className="mt-6">{kpiSlot}</div>
    </section>
  );
}
