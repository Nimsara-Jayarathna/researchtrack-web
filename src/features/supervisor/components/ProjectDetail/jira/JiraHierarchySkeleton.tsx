import { Skeleton } from "@/components/ui/Skeleton";

export function JiraHierarchySkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={`jira-hierarchy-skeleton-${index}`}
          className={`rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm ${
            index > 0 ? "ml-5" : ""
          }`}
        >
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-4 w-12 rounded" />
            <Skeleton className="h-3.5 w-16 rounded" />
            <Skeleton className="h-3.5 w-40 rounded" />
          </div>
          <div className="mt-2 ml-7 h-3 w-28 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
