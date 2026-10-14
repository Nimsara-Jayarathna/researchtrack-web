/** Mirrors the compact project-card structure without implying a project count. */
export function SupervisorProjectCardSkeleton() {
  return (
    <article
      aria-hidden="true"
      className="workspace-panel animate-pulse p-4 motion-reduce:animate-none"
    >
      <div className="flex justify-between gap-3">
        <div className="w-3/5 space-y-2">
          <div className="h-5 w-3/4 rounded bg-slate-200" />
          <div className="h-4 w-full rounded bg-slate-100" />
        </div>
        <div className="h-6 w-20 rounded-full bg-slate-100" />
      </div>
      <div className="my-3 border-t border-slate-100" />
      <div className="flex flex-wrap gap-3">
        <div className="h-4 w-20 rounded bg-slate-100" />
        <div className="h-4 w-24 rounded bg-slate-100" />
        <div className="h-4 w-28 rounded bg-slate-100" />
      </div>
      <div className="mt-4 h-3 w-32 rounded bg-slate-100" />
      <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100" />
      <div className="mt-4 h-8 w-3/4 rounded-xl bg-slate-100" />
    </article>
  );
}
