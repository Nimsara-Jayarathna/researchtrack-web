import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <section className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="max-w-3xl min-w-0">
        <h1 className="break-words text-2xl font-bold tracking-[-0.035em] text-slate-950 sm:text-[30px] lg:text-[34px]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap items-stretch gap-2.5 sm:items-center lg:w-auto">
          {actions}
        </div>
      ) : null}
    </section>
  );
}
