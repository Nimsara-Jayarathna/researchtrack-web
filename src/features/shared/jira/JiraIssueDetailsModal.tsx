import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import type { JiraIssue } from "@/features/shared/types/jira.types";
import { JiraContributorIdentity } from "./JiraVisuals";

type AdfNode = {
  type?: string;
  text?: string;
  marks?: { type?: string; attrs?: Record<string, unknown> }[];
  attrs?: Record<string, unknown>;
  content?: AdfNode[];
};

function textNode(node: AdfNode, key: string): ReactNode {
  let content: ReactNode = node.text ?? "";
  for (const mark of node.marks ?? []) {
    if (mark.type === "strong")
      content = <strong key={`${key}-b`}>{content}</strong>;
    else if (mark.type === "em") content = <em key={`${key}-i`}>{content}</em>;
    else if (mark.type === "code")
      content = (
        <code
          key={`${key}-c`}
          className="rounded bg-slate-100 px-1 py-0.5 text-[0.9em]"
        >
          {content}
        </code>
      );
    else if (
      mark.type === "link" &&
      typeof mark.attrs?.href === "string" &&
      /^(https?:|mailto:)/i.test(mark.attrs.href)
    )
      content = (
        <a
          key={`${key}-a`}
          href={mark.attrs.href}
          target="_blank"
          rel="noreferrer"
          className="text-blue-700 underline underline-offset-2"
        >
          {content}
        </a>
      );
  }
  return content;
}

function renderAdf(node: AdfNode, key = "root"): ReactNode {
  if (node.type === "text") return textNode(node, key);
  const children = (node.content ?? []).map((child, i) =>
    renderAdf(child, `${key}-${i}`),
  );
  switch (node.type) {
    case "doc":
      return <div className="space-y-3">{children}</div>;
    case "paragraph":
      return (
        <p className="leading-6 text-slate-700">
          {children.length ? children : <br />}
        </p>
      );
    case "heading": {
      const level = Number(node.attrs?.level ?? 2);
      const cls =
        "font-semibold text-slate-900 " +
        (level <= 2 ? "text-lg" : "text-base");
      return <div className={cls}>{children}</div>;
    }
    case "bulletList":
      return (
        <ul className="list-disc space-y-1 pl-5 text-slate-700">{children}</ul>
      );
    case "orderedList":
      return (
        <ol className="list-decimal space-y-1 pl-5 text-slate-700">
          {children}
        </ol>
      );
    case "listItem":
      return <li className="pl-1">{children}</li>;
    case "blockquote":
      return (
        <blockquote className="border-l-2 border-slate-300 pl-4 text-slate-600">
          {children}
        </blockquote>
      );
    case "codeBlock":
      return (
        <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
          <code>{children}</code>
        </pre>
      );
    case "hardBreak":
      return <br />;
    case "rule":
      return <hr className="border-slate-200" />;
    default:
      return <>{children}</>;
  }
}

function Description({ value }: { value: string | null }) {
  if (!value)
    return (
      <p className="text-sm text-slate-500">
        No description was provided in Jira.
      </p>
    );
  try {
    const parsed = JSON.parse(value) as AdfNode;
    if (parsed && typeof parsed === "object")
      return <div className="text-sm">{renderAdf(parsed)}</div>;
  } catch {
    /* legacy/plain description */
  }
  return (
    <div className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
      {value}
    </div>
  );
}

function date(value: string | null) {
  return value ? new Date(value).toLocaleString() : "—";
}

export function JiraIssueDetailsModal({
  issue,
  onClose,
}: {
  issue: JiraIssue;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="jira-issue-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex h-[min(90vh,48rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>{issue.issueKey}</span>
              <span>·</span>
              <span>{issue.issueType}</span>
            </div>
            <h2
              id="jira-issue-title"
              className="mt-1 text-xl font-semibold leading-7 text-slate-900"
            >
              {issue.summary}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            aria-label="Close issue details"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-xs text-slate-400">Status</div>
              <div className="mt-1 text-sm font-medium text-slate-800">
                {issue.status}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Priority</div>
              <div className="mt-1 text-sm font-medium text-slate-800">
                {issue.priority ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Story points</div>
              <div className="mt-1 text-sm font-medium text-slate-800">
                {issue.storyPoints ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Parent</div>
              <div className="mt-1 text-sm font-medium text-slate-800">
                {issue.parentIssueKey ?? "—"}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Assignee
            </div>
            <div className="mt-2">
              <JiraContributorIdentity
                accountId={issue.assigneeAccountId ?? issue.assigneeDisplayName}
                displayName={issue.assigneeDisplayName}
              />
            </div>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-5">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Description
            </div>
            <Description value={issue.descriptionJson} />
          </div>
        </div>

        <footer className="grid shrink-0 gap-2 border-t border-slate-200 bg-white px-5 py-4 text-xs text-slate-500 sm:grid-cols-2 sm:px-6">
          <div>
            Created{" "}
            <span className="font-medium text-slate-700">
              {date(issue.createdAt)}
            </span>
          </div>
          <div className="sm:text-right">
            Updated{" "}
            <span className="font-medium text-slate-700">
              {date(issue.updatedAt)}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
