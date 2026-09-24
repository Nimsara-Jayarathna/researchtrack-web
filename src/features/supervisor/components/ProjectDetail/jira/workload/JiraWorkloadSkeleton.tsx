import { Skeleton } from "@/components/ui/Skeleton";

export function JiraWorkloadSkeleton() {
  return (
    <section className="space-y-4" aria-label="Loading team workload">
      {/* Banner skeleton */}
      <Skeleton className="h-16 w-full rounded-2xl" />

      {/* Chart and Card skeleton */}
      <div className="grid gap-4 lg:grid-cols-[1fr_250px]">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>

      {/* Table skeleton */}
      <Skeleton className="h-64 rounded-2xl" />
    </section>
  );
}
