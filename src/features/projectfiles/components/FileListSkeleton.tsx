import { Skeleton, SkeletonTable } from "@/components/ui/Skeleton";

export function FileListSkeleton() {
  return (
    <div
      className="space-y-3"
      role="status"
      aria-label="Loading project files"
      aria-busy="true"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>
      <SkeletonTable rows={4} />
    </div>
  );
}
