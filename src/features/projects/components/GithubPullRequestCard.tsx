import {
  CircleDot,
  GitMerge,
  GitPullRequest,
  GitPullRequestClosed,
  PencilLine,
} from "lucide-react";
import { TimeAgo } from "@/components/ui/TimeAgo";
import type { ProjectGitHubPullRequest } from "../types";
import {
  getPullRequestDisplayStatus,
  getPullRequestLifecycleDate,
  type PullRequestDisplayStatus,
} from "../utils/githubPullRequests";
import { GithubBranchRoute } from "./GithubBranchRoute";

const statusPresentation: Record<
  PullRequestDisplayStatus,
  { label: string; className: string; icon: typeof CircleDot }
> = {
  open: {
    label: "Open",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CircleDot,
  },
  draft: {
    label: "Draft",
    className: "border-slate-200 bg-slate-50 text-slate-600",
    icon: PencilLine,
  },
  merged: {
    label: "Merged",
    className: "border-violet-200 bg-violet-50 text-violet-700",
    icon: GitMerge,
  },
  closed: {
    label: "Closed",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    icon: GitPullRequestClosed,
  },
};

export function PullRequestStatusBadge({
  pullRequest,
}: {
  pullRequest: ProjectGitHubPullRequest;
}) {
  const status = getPullRequestDisplayStatus(pullRequest);
  const presentation = statusPresentation[status];
  const Icon = presentation.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${presentation.className}`}
    >
      <Icon className="h-3 w-3" />
      {presentation.label}
    </span>
  );
}

export function GithubPullRequestCard({
  pullRequest,
  onClick,
}: {
  pullRequest: ProjectGitHubPullRequest;
  onClick: () => void;
}) {
  const lifecycle = getPullRequestLifecycleDate(pullRequest);
  const hasMetrics =
    pullRequest.additions !== null ||
    pullRequest.deletions !== null ||
    pullRequest.changedFiles !== null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-2xl border border-slate-100 bg-white p-4 text-left transition-all hover:border-violet-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2"
      aria-label={`Open pull request #${pullRequest.number}: ${pullRequest.title}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start gap-2">
            <GitPullRequest className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm font-bold leading-5 text-slate-800 transition-colors group-hover:text-violet-800">
                <span className="mr-1.5 font-mono text-xs text-slate-400">
                  #{pullRequest.number}
                </span>
                {pullRequest.title || "Untitled pull request"}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">
                Opened by @{pullRequest.authorLogin || "unknown"}
              </p>
            </div>
          </div>
        </div>
        <PullRequestStatusBadge pullRequest={pullRequest} />
      </div>

      <div className="mt-3">
        <GithubBranchRoute
          sourceBranch={pullRequest.sourceBranch}
          targetBranch={pullRequest.targetBranch}
          variant="card"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-50 pt-3 text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span>{lifecycle.label}</span>
          <TimeAgo date={lifecycle.value} className="font-semibold text-slate-500" />
        </span>
        {hasMetrics ? (
          <span className="inline-flex items-center gap-2 font-medium">
            {pullRequest.additions !== null ? (
              <span className="text-emerald-600">+{pullRequest.additions}</span>
            ) : null}
            {pullRequest.deletions !== null ? (
              <span className="text-rose-600">−{pullRequest.deletions}</span>
            ) : null}
            {pullRequest.changedFiles !== null ? (
              <span>{pullRequest.changedFiles} files</span>
            ) : null}
          </span>
        ) : null}
      </div>
    </button>
  );
}
