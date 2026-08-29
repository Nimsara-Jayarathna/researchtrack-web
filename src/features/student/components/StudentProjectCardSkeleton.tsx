export function StudentProjectCardSkeleton() {
  return (
    <article className="animate-pulse rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="h-6 w-2/3 rounded bg-slate-200" />
        <div className="flex shrink-0 gap-2">
          <div className="h-7 w-20 rounded-full bg-slate-100" />
          <div className="h-7 w-11 rounded-2xl bg-slate-100" />
        </div>
      </div>
      <div className="mt-2 h-4 w-full rounded bg-slate-100" />
      <div className="mt-1 h-4 w-5/6 rounded bg-slate-100" />
      <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(7rem,0.7fr)]">
        <div className="h-14 rounded-2xl bg-slate-100" />
        <div className="h-14 rounded-2xl bg-slate-100" />
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="h-10 rounded-2xl bg-slate-100" />
        <div className="h-10 rounded-2xl bg-slate-100" />
        <div className="h-10 rounded-2xl bg-slate-100 sm:col-span-2" />
      </div>
    </article>
  );
}
