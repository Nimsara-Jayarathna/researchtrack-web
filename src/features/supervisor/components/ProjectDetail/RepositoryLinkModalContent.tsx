import { buttonStyles } from "@/components/ui/Button";
import {
  ExternalLink,
  Github,
  ShieldCheck,
  Info,
  Check,
  Copy,
  RefreshCw,
  Search,
  ArrowRight,
  Crown,
} from "lucide-react";
import type { GitHubAccessRequestSummary, GitHubRepositoryOption } from "../../types";

export type RepositoryLinkMethod =
  "INSTALLATION_DIRECT" | "INSTALLATION_REQUESTED";

type RepositoryLinkModalContentProps = {
  step: "method" | "repository-selection";
  repositorySelectionEntryMode:
    "manual" | "callback-direct" | "callback-requested";
  canReturnToMethods: boolean;
  selectedMethod: RepositoryLinkMethod | null;
  onSelectMethod: (method: RepositoryLinkMethod) => void;
  onBackToMethods: () => void;
  onStartOwnerInstall: () => void;
  isStartingOwnerInstall: boolean;
  accessRequestOwnerLogin: string;
  onAccessRequestOwnerLoginChange: (value: string) => void;
  onCreateAccessRequest: () => void;
  isCreatingAccessRequest: boolean;
  accessRequests: GitHubAccessRequestSummary[];
  isLoadingAccessRequests: boolean;
  revokingAccessRequestId: string | null;
  onReloadAccessRequests: () => void;
  onRevokeAccessRequest: (requestId: string) => void;
  generatedAccessRequestUrl: string | null;
  generatedAccessRequestExpiresAt: string | null;
  onCopyAccessRequestUrl: () => void;
  isAccessRequestLinkCopied: boolean;
  selectedSourceLabel: string | null;
  availableRepositories: GitHubRepositoryOption[];
  isLoadingAvailableRepositories: boolean;
  availableRepositoriesError: string | null;
  onReloadAvailableRepositories: () => void;
  selectedRepositoryIds: string[];
  primaryRepositoryId: string | null;
  customNameByRepositoryId: Record<string, string>;
  maxSelectableCount: number;
  selectionLimitMessage?: string | null;
  onToggleRepository: (repositoryId: string) => void;
  onSetPrimaryRepository: (repositoryId: string) => void;
  onCustomNameChange: (repositoryId: string, value: string) => void;
  onConfirmRepositorySelection: () => void;
  isConfirmingRepositorySelection: boolean;
};

function SelectedCountPill({
  selected,
  limit,
}: {
  selected: number;
  limit: number;
}) {
  return (
    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
      Selected {selected}
      {limit > 0 ? ` / ${limit}` : ""}
    </span>
  );
}

export function RepositoryLinkModalContent({
  step,
  repositorySelectionEntryMode,
  canReturnToMethods,
  selectedMethod,
  onSelectMethod,
  onBackToMethods,
  onStartOwnerInstall,
  isStartingOwnerInstall,
  accessRequestOwnerLogin,
  onAccessRequestOwnerLoginChange,
  onCreateAccessRequest,
  isCreatingAccessRequest,
  accessRequests,
  isLoadingAccessRequests,
  revokingAccessRequestId,
  onReloadAccessRequests,
  onRevokeAccessRequest,
  generatedAccessRequestUrl,
  generatedAccessRequestExpiresAt,
  onCopyAccessRequestUrl,
  isAccessRequestLinkCopied,
  selectedSourceLabel,
  availableRepositories,
  isLoadingAvailableRepositories,
  availableRepositoriesError,
  onReloadAvailableRepositories,
  selectedRepositoryIds,
  primaryRepositoryId,
  customNameByRepositoryId,
  maxSelectableCount,
  selectionLimitMessage,
  onToggleRepository,
  onSetPrimaryRepository,
  onCustomNameChange,
  onConfirmRepositorySelection,
  isConfirmingRepositorySelection,
}: RepositoryLinkModalContentProps) {
  if (step === "repository-selection") {
    const sourceDescription =
      repositorySelectionEntryMode === "callback-requested"
        ? "Access request completed. Select repositories to link."
        : repositorySelectionEntryMode === "callback-direct"
          ? "GitHub installation completed. Select one repository to link."
          : selectedSourceLabel
            ? `Connected Source: ${selectedSourceLabel}`
            : "Select one or more repositories from this source.";

    return (
      <div className="space-y-4">
        <div className="overflow-hidden rounded-3xl border border-indigo-100 bg-indigo-50/10 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <Search className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800">
                {repositorySelectionEntryMode === "callback-direct"
                  ? "Select Repository"
                  : "Select Repositories"}
              </p>
              <p className="text-[10px] font-bold text-indigo-500/70">
                {sourceDescription}
              </p>
            </div>
          </div>
        </div>

        {maxSelectableCount === 0 ? (
          <div className="flex items-center gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-900 shadow-sm animate-in fade-in slide-in-from-top-2">
            <Info className="h-5 w-5 shrink-0 text-amber-500" />
            <p>
              {selectionLimitMessage ??
                "Repository limit reached. Remove an existing repository to add another."}
            </p>
          </div>
        ) : null}

        {isLoadingAvailableRepositories ? (
          <div className="flex items-center justify-center rounded-3xl border border-slate-100 bg-white p-12 text-sm font-bold text-slate-400 shadow-sm">
            <RefreshCw className="mr-3 h-5 w-5 animate-spin text-indigo-400" />
            Loading available repositories...
          </div>
        ) : availableRepositoriesError ? (
          <div className="space-y-4 rounded-3xl border border-rose-100 bg-rose-50 p-6 shadow-sm">
            <p className="text-sm font-bold text-rose-700">
              {availableRepositoriesError}
            </p>
            <button
              type="button"
              className={buttonStyles({
                variant: "secondary",
                size: "sm",
                className: "rounded-xl",
              })}
              onClick={onReloadAvailableRepositories}
            >
              Retry
            </button>
          </div>
        ) : availableRepositories.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-slate-50/50 p-12 text-center text-slate-400 shadow-sm">
            <Github className="mx-auto h-10 w-10 opacity-20" />
            <p className="mt-4 text-sm font-bold">
              {repositorySelectionEntryMode === "callback-direct"
                ? "No repositories are available to this GitHub installation."
                : "No repositories available here."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Available repositories
              </p>
              <SelectedCountPill
                selected={selectedRepositoryIds.length}
                limit={maxSelectableCount}
              />
            </div>

            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {availableRepositories.map((repository) => {
                const selected = selectedRepositoryIds.includes(repository.id);
                const primary = primaryRepositoryId === repository.id;
                const blockedBySelectionLimit =
                  !selected &&
                  maxSelectableCount > 0 &&
                  selectedRepositoryIds.length >= maxSelectableCount;
                const selectionBlocked =
                  isConfirmingRepositorySelection ||
                  (!selected && maxSelectableCount === 0) ||
                  blockedBySelectionLimit;

                return (
                  <div
                    key={repository.id}
                    role="button"
                    tabIndex={selectionBlocked ? -1 : 0}
                    onClick={() => {
                      if (selectionBlocked) {
                        return;
                      }
                      onToggleRepository(repository.id);
                    }}
                    onKeyDown={(event) => {
                      if (selectionBlocked) {
                        return;
                      }
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onToggleRepository(repository.id);
                      }
                    }}
                    className={`relative overflow-hidden rounded-3xl border p-4 transition-all ${
                      selected
                        ? "border-indigo-100 bg-indigo-50/20 shadow-sm"
                        : blockedBySelectionLimit
                          ? "border-slate-100 bg-slate-50/70 opacity-55"
                          : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-md"
                    } ${selectionBlocked ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1 flex shrink-0 items-center justify-center">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (selectionBlocked) {
                              return;
                            }
                            onToggleRepository(repository.id);
                          }}
                          disabled={selectionBlocked}
                          className={`flex h-6 w-6 items-center justify-center rounded-lg border transition-all ${
                            selected
                              ? "border-indigo-500 bg-indigo-500 text-white shadow-lg shadow-indigo-100"
                              : blockedBySelectionLimit
                                ? "border-slate-200 bg-slate-100 text-slate-300"
                                : "border-slate-200 bg-white hover:border-indigo-400"
                          }`}
                        >
                          {selected && <Check className="h-4 w-4" />}
                        </button>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <span className="block truncate text-sm font-black text-slate-800">
                            {repository.fullName}
                          </span>
                          {selected ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                onSetPrimaryRepository(repository.id);
                              }}
                              disabled={isConfirmingRepositorySelection}
                              className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition-all ${
                                primary
                                  ? "border-amber-200 bg-amber-100 text-amber-700 shadow-sm shadow-amber-50"
                                  : "border-slate-200 bg-white text-slate-400 hover:border-amber-300 hover:text-amber-600"
                              }`}
                            >
                              {primary ? (
                                <Crown className="h-3 w-3" />
                              ) : (
                                <div className="h-3 w-3 rounded-full border border-slate-200" />
                              )}
                              {primary
                                ? "Primary (click to unset)"
                                : "Set primary"}
                            </button>
                          ) : null}
                        </div>

                        <a
                          href={repository.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-indigo-500 hover:text-indigo-700 transition-colors"
                        >
                          {repository.url}
                          <ExternalLink className="h-3 w-3" />
                        </a>

                        <div className="mt-2 flex items-center gap-3 text-[10px] font-bold text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                            {repository.ownerLogin}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                            {repository.defaultBranch || "unknown"}
                          </span>
                        </div>

                        {selected && (
                          <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <input
                              value={
                                customNameByRepositoryId[repository.id] ?? ""
                              }
                              onChange={(event) =>
                                onCustomNameChange(
                                  repository.id,
                                  event.target.value,
                                )
                              }
                              onClick={(event) => event.stopPropagation()}
                              placeholder="Set a custom display name..."
                              disabled={isConfirmingRepositorySelection}
                              className="h-10 w-full rounded-2xl border border-indigo-100 bg-white px-4 text-sm font-medium outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50/50"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-4">
          {canReturnToMethods ? (
            <button
              type="button"
              className={buttonStyles({
                variant: "secondary",
                size: "md",
                className: "rounded-2xl px-8 font-bold",
              })}
              onClick={onBackToMethods}
              disabled={isConfirmingRepositorySelection}
            >
              Back
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            className={buttonStyles({
              variant: "primary",
              size: "md",
              className:
                "rounded-2xl px-10 font-bold shadow-lg shadow-indigo-100",
            })}
            onClick={onConfirmRepositorySelection}
            disabled={
              isConfirmingRepositorySelection ||
              selectedRepositoryIds.length === 0
            }
          >
            {isConfirmingRepositorySelection ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            {isConfirmingRepositorySelection
              ? "Linking..."
              : repositorySelectionEntryMode === "callback-direct"
                ? "Link Repository"
                : "Link Selected"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-1">
      <div className="mb-6 flex flex-col items-center text-center">
        <h3 className="text-xl font-black tracking-tight text-slate-800">
          Connection Method
        </h3>
        <p className="mt-1 text-xs font-bold text-slate-400">
          Choose how you want to link your GitHub projects
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            id: "INSTALLATION_DIRECT",
            icon: Github,
            color: "indigo",
            title: "Connect GitHub",
            subtitle: "RECOMMENDED",
            description: "Link from your account or organizations.",
          },
          {
            id: "INSTALLATION_REQUESTED",
            icon: ShieldCheck,
            color: "slate",
            title: "Request Access",
            subtitle: "SECURE",
            description: "Generate a link for the project owner.",
          },
        ].map((method) => {
          const isSelected = selectedMethod === method.id;
          const Icon = method.icon;

          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onSelectMethod(method.id as RepositoryLinkMethod)}
              className={`group relative flex flex-col items-center p-5 text-center transition-all rounded-3xl border ${
                isSelected
                  ? `border-${method.color}-200 bg-${method.color}-50/30 ring-4 ring-${method.color}-50`
                  : "border-slate-100 bg-white hover:border-indigo-100 hover:shadow-lg"
              }`}
            >
              <div
                className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner transition-transform group-hover:scale-110 duration-300 ${
                  isSelected
                    ? `bg-${method.color}-100 text-${method.color}-600`
                    : `bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600`
                }`}
              >
                <Icon className="h-6 w-6" />
              </div>

              <span
                className={`text-[10px] font-black uppercase tracking-[0.15em] opacity-60 ${
                  isSelected ? `text-${method.color}-600` : "text-slate-400"
                }`}
              >
                {method.subtitle}
              </span>
              <h4 className="mt-1 text-sm font-black tracking-tight text-slate-800">
                {method.title}
              </h4>
              <p className="mt-2 text-[10px] font-bold leading-relaxed text-slate-400 line-clamp-2">
                {method.description}
              </p>

              {isSelected && (
                <div
                  className={`absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-${method.color}-500 text-white shadow-sm`}
                >
                  <Check className="h-3 w-3" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {selectedMethod === "INSTALLATION_DIRECT" && (
          <div className="overflow-hidden rounded-3xl border border-indigo-100 bg-indigo-50/20 p-6 shadow-sm">
            <h5 className="flex items-center gap-2 text-[10px] font-black text-indigo-900 uppercase tracking-widest">
              <Github className="h-3.5 w-3.5" />
              Direct Owner Install
            </h5>
            <p className="mt-3 text-xs font-bold text-indigo-700/70 leading-relaxed">
              Redirecting to GitHub to install our companion app. You'll return
              here to pick your repos.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className={buttonStyles({
                  variant: "primary",
                  size: "sm",
                  className:
                    "rounded-xl px-8 shadow-lg shadow-indigo-100 text-[10px] font-black uppercase tracking-wider",
                })}
                onClick={onStartOwnerInstall}
                disabled={isStartingOwnerInstall}
              >
                {isStartingOwnerInstall ? (
                  <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-3.5 w-3.5" />
                )}
                Continue to GitHub
              </button>
            </div>
          </div>
        )}

        {selectedMethod === "INSTALLATION_REQUESTED" && (
          <div className="space-y-4 overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 p-6 shadow-sm">
            <div>
              <h5 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-800">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-500" /> Access Request
              </h5>
              <p className="mt-3 text-xs font-bold leading-relaxed text-slate-500/80">
                Enter the GitHub user or organization that must authorize the ResearchTrack GitHub App. The recipient follows the same GitHub App flow as direct access; only the authorization initiator is different.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500" htmlFor="github-access-owner">GitHub owner / organization</label>
              <input
                id="github-access-owner"
                value={accessRequestOwnerLogin}
                onChange={(event) => onAccessRequestOwnerLoginChange(event.target.value)}
                placeholder="e.g. research-team-org"
                disabled={isCreatingAccessRequest || Boolean(generatedAccessRequestUrl)}
                className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 disabled:bg-slate-50"
              />
              {!generatedAccessRequestUrl ? (
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    className={buttonStyles({ variant: "primary", size: "sm", className: "rounded-xl px-6 text-[10px] font-black uppercase tracking-wider" })}
                    onClick={onCreateAccessRequest}
                    disabled={isCreatingAccessRequest || !accessRequestOwnerLogin.trim()}
                  >
                    {isCreatingAccessRequest ? <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="mr-2 h-3.5 w-3.5" />}
                    Generate secure request
                  </button>
                </div>
              ) : null}
            </div>

            {generatedAccessRequestUrl ? (
              <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Share this one-time request link</p>
                  {generatedAccessRequestExpiresAt ? <span className="rounded-lg bg-rose-50 px-2 py-0.5 text-[9px] font-black text-rose-500">Expires {new Date(generatedAccessRequestExpiresAt).toLocaleString()}</span> : null}
                </div>
                <div className="mt-2.5 break-all rounded-xl bg-slate-50 p-3 font-mono text-[10px] text-slate-600">{generatedAccessRequestUrl}</div>
                <div className="mt-4 flex justify-end">
                  <button type="button" className={buttonStyles({ variant: "primary", size: "sm", className: "rounded-xl px-6 text-[10px] font-black uppercase tracking-wider" })} onClick={onCopyAccessRequestUrl}>
                    {isAccessRequestLinkCopied ? <Check className="mr-2 h-3.5 w-3.5" /> : <Copy className="mr-2 h-3.5 w-3.5" />}
                    {isAccessRequestLinkCopied ? "Copied" : "Copy link"}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Recent requests</p>
                  <p className="mt-1 text-xs text-slate-400">Pending requests can be copied again or revoked. Expired and completed requests remain visible for audit.</p>
                </div>
                <button type="button" onClick={onReloadAccessRequests} disabled={isLoadingAccessRequests} className="rounded-lg border border-slate-200 p-2 text-slate-500 disabled:opacity-50" title="Refresh requests">
                  <RefreshCw className={`h-4 w-4 ${isLoadingAccessRequests ? "animate-spin" : ""}`} />
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {isLoadingAccessRequests ? <p className="text-xs text-slate-500">Loading requests…</p> : accessRequests.length === 0 ? <p className="text-xs text-slate-500">No access requests yet.</p> : accessRequests.map((request) => (
                  <div key={request.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{request.ownerLogin}</p>
                        <p className="mt-0.5 text-[10px] text-slate-500">{request.status} · expires {new Date(request.expiresAt).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {request.status === "PENDING" && request.requestUrl ? (
                          <button type="button" onClick={() => void navigator.clipboard.writeText(request.requestUrl!)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-600">Copy</button>
                        ) : null}
                        {request.status === "PENDING" ? (
                          <button type="button" onClick={() => onRevokeAccessRequest(request.id)} disabled={revokingAccessRequestId === request.id} className="rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-rose-600 disabled:opacity-50">{revokingAccessRequestId === request.id ? "Revoking…" : "Revoke"}</button>
                        ) : null}
                      </div>
                    </div>
                    {request.errorCode ? <p className="mt-2 text-[10px] font-semibold text-rose-600">{request.errorCode.replace(/_/g, " ")}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
