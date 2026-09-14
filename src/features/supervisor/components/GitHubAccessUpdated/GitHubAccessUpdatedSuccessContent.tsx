import type { GitHubAccessUpdatedSummary } from "../../types";

type GitHubAccessUpdatedSuccessContentProps = {
  summary: GitHubAccessUpdatedSummary;
  scopeLabel: string | null;
  isExternalRecipient?: boolean;
};

export function GitHubAccessUpdatedSuccessContent({
  summary,
  scopeLabel,
  isExternalRecipient = false,
}: GitHubAccessUpdatedSuccessContentProps) {
  return (
    <div className="space-y-3 text-left">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Project
        </p>
        <p className="mt-1 text-sm font-semibold text-foreground">
          {summary.projectTitle}
        </p>
        {scopeLabel ? (
          <p className="mt-2 text-xs text-muted-foreground">{scopeLabel}</p>
        ) : null}
      </div>


      {isExternalRecipient ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3 text-sm text-sky-900">
          GitHub App authorization is complete. You can close this page. The ResearchTrack supervisor will choose which authorized repositories to link to the project.
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white/80 p-3">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Accessible Repositories
        </p>
        {summary.repositories.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No repositories are currently visible under this installation.
          </p>
        ) : (
          <div className="mt-2 max-h-44 space-y-2 overflow-y-auto pr-1">
            {summary.repositories.map((repository) => (
              <div
                key={repository.repositoryId}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <p className="text-sm font-medium text-foreground">
                  {repository.fullName}
                </p>
                <a
                  href={repository.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-sky-700 underline-offset-2 hover:underline"
                >
                  {repository.url}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
