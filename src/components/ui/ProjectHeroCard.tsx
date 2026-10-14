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
    <section className={rootClassName ?? "workspace-panel p-4 sm:px-5 sm:py-4"}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold tracking-[-0.035em] text-slate-950 sm:text-[30px] lg:text-[34px]">
            {title}
          </h1>
          {subtitle.trim() &&
          subtitle.trim().toLowerCase() !== title.trim().toLowerCase() ? (
            <p
              className="mt-1 text-sm leading-5 text-muted-foreground sm:text-[15px] sm:leading-6"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="shrink-0 self-start lg:self-auto">{rightSlot}</div>
      </div>

      <div className="mt-4 h-px w-full bg-slate-100" />

      <div className="mt-3">{kpiSlot}</div>
    </section>
  );
}
