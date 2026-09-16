import {
  CalendarClock,
  ExternalLink,
  FileDiff,
  Files,
  GitCommit,
  GitMerge,
  GitPullRequest,
  MessageSquare,
  Plus,
  Minus,
  UserRound,
} from "lucide-react";
import { buttonStyles } from "@/components/ui/Button";
import { parseApiDate } from "@/lib/dateTime";
import type { ProjectGitHubPullRequest } from "../types";
import { getSafeGitHubUrl } from "../utils/githubPullRequests";
import { PullRequestStatusBadge } from "./GithubPullRequestCard";
import { GithubBranchRoute } from "./GithubBranchRoute";
import { GithubMarkdown } from "./GithubMarkdown";

const dateTimeFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = parseApiDate(value);
  return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date);
}

type Tone = "green" | "rose" | "blue" | "violet" | "amber" | "slate";

const toneClasses: Record<Tone, string> = {
  green: "border-emerald-100 bg-emerald-50/60 text-emerald-700",
  rose: "border-rose-100 bg-rose-50/60 text-rose-700",
  blue: "border-sky-100 bg-sky-50/60 text-sky-700",
  violet: "border-violet-100 bg-violet-50/60 text-violet-700",
  amber: "border-amber-100 bg-amber-50/60 text-amber-700",
  slate: "border-slate-100 bg-slate-50/70 text-slate-700",
};

function EvidenceMetric({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  tone: Tone;
  icon: typeof Plus;
}) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClasses[tone]}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 opacity-70" />
        <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-70">
          {label}
        </p>
      </div>
      <p className="mt-2 text-xl font-black">{value}</p>
    </div>
  );
}

function TimelineMetric({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-700">
        {formatDate(value)}
      </p>
    </div>
  );
}

function IdentityCard({
  label,
  username,
  icon: Icon,
  tone = "slate",
}: {
  label: string;
  username: string | null;
  icon: typeof UserRound;
  tone?: Tone;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${toneClasses[tone]}`}>
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] opacity-70">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p
        className="mt-1.5 truncate text-sm font-black"
        title={username ? `@${username}` : "Not recorded"}
      >
        {username ? `@${username}` : "Not recorded"}
      </p>
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
    <div className="space-y-6 pb-1">
      <section className="overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50/80 via-white to-indigo-50/50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-violet-500">
              <GitPullRequest className="h-4 w-4" />
              Pull request #{pullRequest.number}
            </div>
            <h4 className="mt-2 text-xl font-black leading-7 text-slate-900">
              {pullRequest.title || "Untitled pull request"}
            </h4>
          </div>
          <PullRequestStatusBadge pullRequest={pullRequest} />
        </div>

        <div
          className={`mt-5 grid gap-3 ${pullRequest.isMerged ? "md:grid-cols-2" : ""}`}
        >
          <IdentityCard
            label="Opened by"
            username={pullRequest.authorLogin}
            icon={UserRound}
          />
          {pullRequest.isMerged ? (
            <IdentityCard
              label="Merged by"
              username={pullRequest.mergedByLogin}
              icon={GitMerge}
              tone="violet"
            />
          ) : null}
        </div>

        <div className="mt-3 rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            <GitPullRequest className="h-3.5 w-3.5" />
            Branch route
          </div>
          <GithubBranchRoute
            sourceBranch={pullRequest.sourceBranch}
            targetBranch={pullRequest.targetBranch}
            variant="detail"
          />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <FileDiff className="h-4 w-4 text-slate-400" />
          <h5 className="text-sm font-bold text-slate-800">Change evidence</h5>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <EvidenceMetric
            label="Additions"
            value={pullRequest.additions ?? "—"}
            tone="green"
            icon={Plus}
          />
          <EvidenceMetric
            label="Deletions"
            value={pullRequest.deletions ?? "—"}
            tone="rose"
            icon={Minus}
          />
          <EvidenceMetric
            label="Changed files"
            value={pullRequest.changedFiles ?? "—"}
            tone="blue"
            icon={Files}
          />
          <EvidenceMetric
            label="Commits"
            value={pullRequest.commitsCount ?? "—"}
            tone="violet"
            icon={GitCommit}
          />
        </div>

        <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-amber-700">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] opacity-70">
            <MessageSquare className="h-3.5 w-3.5" />
            Conversation
          </div>
          <p className="mt-1 text-sm font-bold">
            {pullRequest.commentsCount ?? 0} comments
            {pullRequest.reviewCommentsCount !== null
              ? ` · ${pullRequest.reviewCommentsCount} review comments`
              : ""}
          </p>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-slate-400" />
          <h5 className="text-sm font-bold text-slate-800">Timeline</h5>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <TimelineMetric label="Created" value={pullRequest.createdAt} />
          <TimelineMetric label="Updated" value={pullRequest.updatedAt} />
          <TimelineMetric label="Closed" value={pullRequest.closedAt} />
          <TimelineMetric label="Merged" value={pullRequest.mergedAt} />
        </div>
      </section>

      {pullRequest.body?.trim() ? (
        <section>
          <h5 className="text-sm font-bold text-slate-800">Description</h5>
          <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
            <GithubMarkdown markdown={pullRequest.body.trim()} />
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Technical details
        </p>
        <div className="mt-2">
          <p className="text-[10px] font-semibold text-slate-400">
            GitHub PR ID
          </p>
          <p className="mt-0.5 break-all font-mono text-xs font-semibold text-slate-600">
            {pullRequest.gitHubPullRequestId}
          </p>
        </div>
      </section>

      <div className="sticky bottom-0 z-10 -mx-1 flex justify-end border-t border-slate-100 bg-white/95 px-1 py-3 backdrop-blur">
        {githubUrl ? (
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer noopener"
            className={buttonStyles({
              variant: "secondary",
              size: "sm",
              className: "gap-2 rounded-xl shadow-sm",
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
