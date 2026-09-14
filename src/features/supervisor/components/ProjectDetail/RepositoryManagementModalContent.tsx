import { SyncStatusBadge } from "@/components/ui/SyncStatusBadge";
import { normalizeSyncStatus } from "@/lib/syncStatus";
import { Github, Pencil, RefreshCw, Unlink, Unplug } from "lucide-react";

export type RepositoryManagementRow = {
  rowKey: string;
  sourceId: string | null;
  accessType: string;
  githubRepositoryId: string | null;
  githubRepoId: number | null;
  linkId: string | null;
  enabled: boolean;
  primary: boolean;
  customName: string | null;
  name: string | null;
  fullName: string | null;
  ownerLogin: string | null;
  url: string | null;
  syncStatus: string | null;
};

export type RepositoryManagementSource = {
  id: string;
  ownerLogin: string;
  accessType: string;
  installationId: number | null;
  linkedRepositoryCount: number;
  hasSyncInProgress: boolean;
};

type Props = {
  rows: RepositoryManagementRow[];
  sources: RepositoryManagementSource[];
  linkedCount: number;
  maxLinkedRepositories: number;
  enabledCount: number;
  maxEnabledRepositories: number;
  remainingLinkSlots: number;
  remainingEnabledSlots: number;
  isMutating: boolean;
  onSelectPrimary: (linkId: string) => void;
  onRefresh: (linkId: string) => void;
  onToggleEnabled: (row: RepositoryManagementRow) => void;
  onUnlinkRepository: (linkId: string) => void;
  onDisconnectSource: (sourceId: string) => void;
  isSavingDisplayName: boolean;
  onStartDisplayNameEdit: (row: RepositoryManagementRow) => void;
};

function accessLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part ? part[0].toUpperCase() + part.slice(1) : part)
    .join(" ");
}

function nameFor(row: RepositoryManagementRow) {
  return row.customName?.trim() || row.name?.trim() || row.fullName?.trim() || "Unnamed repository";
}

export function RepositoryManagementModalContent({
  rows,
  sources,
  linkedCount,
  maxLinkedRepositories,
  enabledCount,
  maxEnabledRepositories,
  remainingEnabledSlots,
  isMutating,
  onSelectPrimary,
  onRefresh,
  onToggleEnabled,
  onUnlinkRepository,
  onDisconnectSource,
  isSavingDisplayName,
  onStartDisplayNameEdit,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Linked repositories</p>
          <p className="mt-1 text-lg font-bold text-slate-800">{linkedCount} / {maxLinkedRepositories}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Enabled repositories</p>
          <p className="mt-1 text-lg font-bold text-slate-800">{enabledCount} / {maxEnabledRepositories}</p>
        </div>
      </div>

      <section className="space-y-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900">GitHub App access sources</h4>
          <p className="mt-1 text-xs text-slate-500">
            Disconnecting a source removes all project links from that GitHub App installation. It does not uninstall the app from GitHub.
          </p>
        </div>
        {sources.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">No active GitHub App access sources.</div>
        ) : (
          <div className="space-y-2">
            {sources.map((source) => (
              <div key={source.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{source.ownerLogin}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {accessLabel(source.accessType)} · {source.linkedRepositoryCount} linked repo{source.linkedRepositoryCount === 1 ? "" : "s"}
                    {source.installationId ? ` · installation ${source.installationId}` : ""}
                  </p>
                  {source.hasSyncInProgress ? (
                    <p className="mt-2 text-xs font-semibold text-amber-700">Disconnect is locked while a repository sync is in progress.</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => onDisconnectSource(source.id)}
                  disabled={isMutating || source.hasSyncInProgress}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Unplug className="h-4 w-4" /> Disconnect source
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Linked repositories</h4>
          <p className="mt-1 text-xs text-slate-500">Disable keeps the link and evidence; unlink removes only this project-repository relationship.</p>
        </div>
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">No repositories are linked yet.</div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => {
              const syncStatus = normalizeSyncStatus(row.syncStatus);
              const isSyncing = syncStatus === "IN_PROGRESS";
              const isQueued = syncStatus === "PENDING";
              const enablingBlocked = !row.enabled && remainingEnabledSlots < 1;
              const mutationBlocked = isMutating || isSavingDisplayName;
              return (
                <article key={row.rowKey} className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${row.enabled ? "" : "opacity-75"}`}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-bold text-slate-900">{nameFor(row)}</p>
                        {row.primary ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">PRIMARY</span> : null}
                        <SyncStatusBadge syncStatus={syncStatus} mode="sync" />
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-500">{row.fullName || row.ownerLogin || "Unknown repository"}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{accessLabel(row.accessType)}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                        <span>{row.enabled ? "Enabled" : "Disabled"}</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={row.enabled}
                          aria-label={row.enabled ? "Disable repository" : "Enable repository"}
                          onClick={() => onToggleEnabled(row)}
                          disabled={mutationBlocked || isSyncing || enablingBlocked}
                          title={isSyncing ? "Cannot change state while synchronization is in progress" : enablingBlocked ? "Enabled repository limit reached" : row.enabled ? "Disable repository" : "Enable repository"}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full border transition ${row.enabled ? "border-emerald-500 bg-emerald-500" : "border-slate-300 bg-slate-200"} disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          <span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${row.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                        </button>
                      </label>

                      {row.enabled && !row.primary && row.linkId ? (
                        <button type="button" onClick={() => onSelectPrimary(row.linkId!)} disabled={mutationBlocked || isSyncing} className="rounded-xl border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700 disabled:opacity-50">Set primary</button>
                      ) : null}
                      {row.url ? (
                        <a href={row.url} target="_blank" rel="noreferrer" title="Open repository" className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white"><Github className="h-4 w-4" /></a>
                      ) : null}
                      {row.linkId ? (
                        <button type="button" onClick={() => onStartDisplayNameEdit(row)} disabled={mutationBlocked} title="Edit display name" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700 disabled:opacity-50"><Pencil className="h-4 w-4" /></button>
                      ) : null}
                      {row.enabled && row.linkId ? (
                        <button type="button" onClick={() => onRefresh(row.linkId!)} disabled={mutationBlocked || isSyncing || isQueued} title={isSyncing || isQueued ? "Synchronization already queued or in progress" : "Refresh repository"} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} /></button>
                      ) : null}
                      {row.linkId ? (
                        <button type="button" onClick={() => onUnlinkRepository(row.linkId!)} disabled={mutationBlocked || isSyncing} title={isSyncing ? "Cannot unlink while synchronization is in progress" : "Unlink repository"} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"><Unlink className="h-4 w-4" /></button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
