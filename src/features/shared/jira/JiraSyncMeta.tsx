import { LastSyncedBadge } from "@/components/ui/LastSyncedBadge";
import { SyncStatusBadge } from "@/components/ui/SyncStatusBadge";
import type { JiraSyncState } from "@/features/shared/types/jira.types";

export function JiraSyncMeta({ sync }: { sync: JiraSyncState }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <SyncStatusBadge syncStatus={sync.status} mode="sync" />
      <LastSyncedBadge
        lastSyncedAt={sync.lastSyncedAt}
        fallbackText="Not synchronized yet"
      />
    </div>
  );
}
