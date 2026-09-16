import {
  ArrowRight,
  CalendarClock,
  ExternalLink,
  FileDiff,
  GitCommit,
  GitPullRequest,
  MessageSquare,
  UserRound,
} from "lucide-react";
import { buttonStyles } from "@/components/ui/Button";
import { parseApiDate } from "@/lib/dateTime";
import type { ProjectGitHubPullRequest } from "../types";
import { getSafeGitHubUrl } from "../utils/githubPullRequests";
import { PullRequestStatusBadge } from "./GithubPullRequestCard";

const dateTimeFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatDate(value: string | null) {
  if (!value) return "Not recorded";
  const date = parseApiDate(value);
  return Number.isNaN(date.getTime())
    ? "Not recorded"
    : dateTimeFormatter.format(date);
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-700">{value}</p>
    </div>
  );
}

export function GithubPullRequestDetailsContent({
  pullRequest,
}: {
  pullRequest: ProjectGitHubPullRequest;
}) {
  const githubUrl = getSafeGitHubUrl(pullRequest.htmlUrl);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-100 bg-slate-50/40 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <GitPullRequest className="h-4 w-4 text-violet-500" />
              Pull request #{pullRequest.number}
            </div>
            <h4 className="mt-2 text-xl font-black leading-7 text-slate-900">
              {pullRequest.title || "Untitled pull request"}
            </h4>
          </div>
          <PullRequestStatusBadge pullRequest={pullRequest} />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              <UserRound className="h-3.5 w-3.5" />
              Opened by
            </div>
            <p className="mt-1.5 text-sm font-bold text-slate-800">
              @{pullRequest.authorLogin || "unknown"}
            </p>
          </div>
          <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              <GitPullRequest className="h-3.5 w-3.5" />
              Branch route
            </div>
            <div className="mt-1.5 flex min-w-0 items-center gap-2 font-mono text-xs font-semibold text-slate-700">
              <span className="truncate" title={pullRequest.sourceBranch}>
                {pullRequest.sourceBranch || "unknown"}
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
              <span className="truncate" title={pullRequest.targetBranch}>
                {pullRequest.targetBranch || "unknown"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <FileDiff className="h-4 w-4 text-slate-400" />
          <h5 className="text-sm font-bold text-slate-800">Change evidence</h5>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Additions" value={pullRequest.additions ?? "—"} />
          <Metric label="Deletions" value={pullRequest.deletions ?? "—"} />
          <Metric label="Changed files" value={pullRequest.changedFiles ?? "—"} />
          <Metric label="Commits" value={pullRequest.commitsCount ?? "—"} />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              <MessageSquare className="h-3.5 w-3.5" />
              Conversation
            </div>
            <p className="mt-1 text-sm font-bold text-slate-700">
              {pullRequest.commentsCount ?? 0} comments
              {pullRequest.reviewCommentsCount !== null
                ? ` · ${pullRequest.reviewCommentsCount} review comments`
                : ""}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              <GitCommit className="h-3.5 w-3.5" />
              GitHub PR ID
            </div>
            <p className="mt-1 break-all font-mono text-xs font-semibold text-slate-700">
              {pullRequest.gitHubPullRequestId}
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-slate-400" />
          <h5 className="text-sm font-bold text-slate-800">Timeline</h5>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Created" value={formatDate(pullRequest.createdAt)} />
          <Metric label="Updated" value={formatDate(pullRequest.updatedAt)} />
          <Metric label="Closed" value={formatDate(pullRequest.closedAt)} />
          <Metric label="Merged" value={formatDate(pullRequest.mergedAt)} />
        </div>
      </section>

      {pullRequest.body?.trim() ? (
        <section>
          <h5 className="text-sm font-bold text-slate-800">Description</h5>
          <div className="mt-3 max-h-60 overflow-y-auto whitespace-pre-wrap break-words rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm leading-6 text-slate-600">
            {pullRequest.body.trim()}
          </div>
        </section>
      ) : null}

      <div className="flex justify-end border-t border-slate-100 pt-4">
        {githubUrl ? (
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className={buttonStyles({
              variant: "secondary",
              size: "sm",
              className: "gap-2 rounded-xl",
            })}
          >
            View on GitHub
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <span className="text-xs text-slate-400">
            GitHub link is unavailable for this pull request.
          </span>
        )}
      </div>
    </div>
  );
}
