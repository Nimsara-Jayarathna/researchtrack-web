import { X } from "lucide-react";
import type { ReactNode } from "react";
import type { JiraIssue } from "@/features/shared/types/jira.types";

type Props = { issue: JiraIssue | null; onClose: () => void };
type AdfNode = { type?: string; text?: string; attrs?: Record<string, unknown>; marks?: Array<{type?: string; attrs?: Record<string, unknown>}>; content?: AdfNode[] };

function parseDescription(raw: string | null): unknown {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return raw; }
}
function marked(text: ReactNode, marks?: AdfNode["marks"]) {
  return (marks ?? []).reduce<ReactNode>((value, mark) => {
    if (mark.type === "strong") return <strong>{value}</strong>;
    if (mark.type === "em") return <em>{value}</em>;
    if (mark.type === "code") return <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[.9em]">{value}</code>;
    if (mark.type === "strike") return <s>{value}</s>;
    if (mark.type === "link") { const href=String(mark.attrs?.href ?? ""); const safe=/^https?:\/\//i.test(href); return safe ? <a className="text-blue-600 underline underline-offset-2" href={href} target="_blank" rel="noreferrer">{value}</a> : value; }
    return value;
  }, text);
}
function renderNode(node: AdfNode, key: string): ReactNode {
  if (node.type === "text") return <span key={key}>{marked(node.text ?? "", node.marks)}</span>;
  if (node.type === "hardBreak") return <br key={key}/>;
  const children=(node.content ?? []).map((n,i)=>renderNode(n,`${key}-${i}`));
  switch(node.type) {
    case "doc": return <div key={key} className="space-y-3">{children}</div>;
    case "paragraph": return <p key={key} className="leading-7 text-slate-700">{children.length ? children : <br/>}</p>;
    case "heading": { const level=Number(node.attrs?.level ?? 2); return <div key={key} className={level <= 2 ? "pt-2 text-lg font-semibold text-slate-900" : "pt-1 text-base font-semibold text-slate-900"}>{children}</div>; }
    case "bulletList": return <ul key={key} className="list-disc space-y-1 pl-6 text-slate-700">{children}</ul>;
    case "orderedList": return <ol key={key} className="list-decimal space-y-1 pl-6 text-slate-700">{children}</ol>;
    case "listItem": return <li key={key}>{children}</li>;
    case "blockquote": return <blockquote key={key} className="border-l-4 border-slate-200 pl-4 text-slate-600">{children}</blockquote>;
    case "codeBlock": return <pre key={key} className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm text-slate-100"><code>{children}</code></pre>;
    case "rule": return <hr key={key} className="border-slate-200"/>;
    case "table": return <div key={key} className="overflow-x-auto"><table className="min-w-full border-collapse text-sm"><tbody>{children}</tbody></table></div>;
    case "tableRow": return <tr key={key}>{children}</tr>;
    case "tableHeader": return <th key={key} className="border border-slate-200 bg-slate-50 px-3 py-2 text-left font-semibold">{children}</th>;
    case "tableCell": return <td key={key} className="border border-slate-200 px-3 py-2 align-top">{children}</td>;
    default: return <div key={key}>{children}</div>;
  }
}
function Description({ raw }: { raw: string | null }) {
  const parsed=parseDescription(raw);
  if (!parsed) return <p className="text-sm italic text-slate-400">No description was provided in Jira.</p>;
  if (typeof parsed === "string") return <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{parsed}</div>;
  if (typeof parsed === "object") return <div className="text-sm">{renderNode(parsed as AdfNode,"root")}</div>;
  return null;
}
function date(value: string | null) { return value ? new Date(value).toLocaleString() : "—"; }
export function JiraIssueDetailsModal({ issue, onClose }: Props) {
  if (!issue) return null;
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-labelledby="jira-issue-title" onMouseDown={(e)=>{if(e.target===e.currentTarget) onClose();}}>
    <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
        <div className="min-w-0"><div className="mb-1 flex flex-wrap items-center gap-2"><span className="font-mono text-xs font-semibold text-slate-500">{issue.issueKey}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">{issue.issueType}</span><span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">{issue.status}</span></div><h2 id="jira-issue-title" className="text-xl font-semibold text-slate-950">{issue.summary}</h2></div>
        <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Close issue details"><X className="h-5 w-5"/></button>
      </header>
      <div className="overflow-y-auto px-6 py-5">
        <div className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div><div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Priority</div><div className="mt-1 text-sm font-medium text-slate-700">{issue.priority ?? "—"}</div></div>
          <div><div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Assignee</div><div className="mt-1 text-sm font-medium text-slate-700">{issue.assigneeDisplayName ?? "Unassigned"}</div></div>
          <div><div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Story points</div><div className="mt-1 text-sm font-medium text-slate-700">{issue.storyPoints ?? "—"}</div></div>
          <div><div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Parent</div><div className="mt-1 text-sm font-medium text-slate-700">{issue.parentIssueKey ?? "—"}</div></div>
        </div>
        <section><h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Description</h3><Description raw={issue.descriptionJson}/></section>
        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-400"><span>Created {date(issue.createdAt)}</span><span>Updated {date(issue.updatedAt)}</span>{issue.dueDate ? <span>Due {date(issue.dueDate)}</span> : null}</div>
      </div>
    </div>
  </div>;
}
