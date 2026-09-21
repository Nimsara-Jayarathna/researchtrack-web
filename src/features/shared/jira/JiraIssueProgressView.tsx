import {
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  RefreshCw,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { BlockingState } from "@/components/ui/BlockingState";
import { JiraSyncMeta } from "./JiraSyncMeta";
import { JiraIssueDetailsModal } from "./JiraIssueDetailsModal";
import { JiraContributorIdentity, JiraMetricCard } from "./JiraVisuals";
import type { JiraIssue, JiraIssueList } from "@/features/shared/types/jira.types";

type Props = {
  projectId: string;
  fetcher: (projectId: string) => Promise<JiraIssueList>;
  refresher?: (projectId: string) => Promise<unknown>;
};

type TreeNode = { issue: JiraIssue; children: TreeNode[] };
type VisibleRow = { node: TreeNode; depth: number; matched: boolean };

function statusClass(category: string | null) {
  const value = category?.toLowerCase();
  if (value === "done") return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";
  if (value === "indeterminate" || value === "in_progress")
    return "bg-blue-50 text-blue-700 ring-blue-600/10";
  return "bg-slate-100 text-slate-700 ring-slate-600/10";
}

function typeTone(type: string) {
  const value = type.toLowerCase();
  if (value === "epic") return "bg-violet-50 text-violet-700 ring-violet-600/10";
  if (value === "story") return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";
  if (value === "bug") return "bg-rose-50 text-rose-700 ring-rose-600/10";
  if (value.includes("sub")) return "bg-slate-100 text-slate-600 ring-slate-600/10";
  return "bg-sky-50 text-sky-700 ring-sky-600/10";
}

function issueRank(issue: JiraIssue) {
  const type = issue.issueType.toLowerCase();
  if (type === "epic") return 0;
  if (type === "story") return 1;
  if (type === "task" || type === "bug") return 2;
  if (issue.isSubtask || type.includes("sub")) return 3;
  return 2;
}

function keyNumber(key: string) {
  const match = key.match(/-(\d+)$/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function compareNodes(a: TreeNode, b: TreeNode) {
  return issueRank(a.issue) - issueRank(b.issue) || keyNumber(a.issue.issueKey) - keyNumber(b.issue.issueKey) || a.issue.issueKey.localeCompare(b.issue.issueKey);
}

function buildTree(items: JiraIssue[]) {
  const nodes = new Map(items.map((issue) => [issue.issueKey, { issue, children: [] as TreeNode[] }]));
  const roots: TreeNode[] = [];
  const orphans = new Set<string>();

  for (const node of nodes.values()) {
    const parentKey = node.issue.parentIssueKey;
    const parent = parentKey ? nodes.get(parentKey) : undefined;
    // A missing parent is valid (for example when Jira search scope excludes the parent).
    // Never invent a relationship from issue keys or names.
    if (parent && parent !== node) parent.children.push(node);
    else {
      roots.push(node);
      if (parentKey && !parent) orphans.add(node.issue.issueKey);
    }
  }

  const seen = new Set<string>();
  const sort = (node: TreeNode) => {
    if (seen.has(node.issue.issueKey)) return;
    seen.add(node.issue.issueKey);
    node.children.sort(compareNodes);
    node.children.forEach(sort);
  };
  roots.sort(compareNodes);
  roots.forEach(sort);
  return { roots, orphans };
}

function collectExpandable(nodes: TreeNode[], result = new Set<string>()) {
  for (const node of nodes) {
    if (node.children.length) result.add(node.issue.issueKey);
    collectExpandable(node.children, result);
  }
  return result;
}

export function JiraIssueProgressView({ projectId, fetcher, refresher }: Props) {
  const [data, setData] = useState<JiraIssueList | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedIssue, setSelectedIssue] = useState<JiraIssue | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setData(await fetcher(projectId)); }
    catch { setError("Unable to load synchronized Jira issues."); }
    finally { setLoading(false); }
  }, [fetcher, projectId]);

  useEffect(() => { void load(); }, [load]);

  const tree = useMemo(() => buildTree(data?.items ?? []), [data?.items]);
  const expandable = useMemo(() => collectExpandable(tree.roots), [tree.roots]);

  useEffect(() => {
    // A large Jira project is easier to scan from its roots. Search still reveals matching ancestry.
    setExpanded(new Set());
  }, [data?.items]);

  const normalizedQuery = query.trim().toLowerCase();
  const rows = useMemo(() => {
    const result: VisibleRow[] = [];
    const matchesType = (issue: JiraIssue) => typeFilter === "all" || issue.issueType.toLowerCase() === typeFilter || (typeFilter === "subtask" && (issue.isSubtask || issue.issueType.toLowerCase().includes("sub")));
    const matchesText = (issue: JiraIssue) => !normalizedQuery || [issue.issueKey, issue.summary, issue.issueType, issue.status, issue.assigneeDisplayName ?? "", issue.priority ?? ""].some((v) => v.toLowerCase().includes(normalizedQuery));
    const matchesSelf = (issue: JiraIssue) => matchesType(issue) && matchesText(issue);
    const containsMatch = (node: TreeNode): boolean => matchesSelf(node.issue) || node.children.some(containsMatch);
    const walk = (node: TreeNode, depth: number) => {
      const selfMatch = matchesSelf(node.issue);
      const filtering = normalizedQuery.length > 0 || typeFilter !== "all";
      if (filtering && !containsMatch(node)) return;
      result.push({ node, depth, matched: filtering && selfMatch });
      const shouldOpen = filtering || expanded.has(node.issue.issueKey);
      if (shouldOpen) node.children.forEach((child) => walk(child, depth + 1));
    };
    tree.roots.forEach((root) => walk(root, 0));
    return result;
  }, [tree.roots, normalizedQuery, typeFilter, expanded]);

  const refresh = async () => {
    if (!refresher || refreshing) return;
    setRefreshing(true); setError(null);
    try { await refresher(projectId); await load(); }
    catch { setError("Unable to refresh Jira data. Existing synchronized data is still available."); }
    finally { setRefreshing(false); }
  };

  if (loading && !data) return <BlockingState isActive message="Loading synchronized Jira issues…" className="min-h-40" />;
  if (error && !data) return <div className="rounded-3xl border border-rose-200 bg-white p-8 text-rose-700">{error}</div>;
  if (!data) return null;

  const hasLocalSnapshot = data.items.length > 0;
  const neverSynced = !hasLocalSnapshot && !data.sync.lastSyncedAt && data.sync.status !== "SYNCED";
  const rootCount = tree.roots.length;
  const childCount = Math.max(0, data.items.length - rootCount);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Jira issues & task progress</h3>
          <p className="text-sm text-slate-500">Hierarchical ResearchTrack Jira snapshot</p>
          <div className="mt-1"><JiraSyncMeta sync={data.sync} /></div>
        </div>
        {refresher ? <button type="button" onClick={() => void refresh()} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />{refreshing ? "Refreshing…" : "Refresh Jira"}</button> : null}
      </div>

      {error ? <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div> : null}
      {data.sync.status === "FAILED" && data.sync.lastSyncError ? <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Latest Jira synchronization failed. Showing the last stored data. {data.sync.lastSyncError}</div> : null}

      <div className="grid gap-3 sm:grid-cols-4">
        <JiraMetricCard label="Total" value={data.summary.total} />
        <JiraMetricCard label="To do" value={data.summary.toDo} tone="todo" />
        <JiraMetricCard label="In progress" value={data.summary.inProgress} tone="active" />
        <JiraMetricCard label="Done" value={data.summary.done} tone="done" />
      </div>

      {neverSynced ? <EmptyState title="Jira issues have not been synchronized yet" description={refresher ? "Use Refresh Jira to create the local ResearchTrack issue snapshot." : "Ask your supervisor to synchronize Jira data."} /> : data.items.length === 0 ? <EmptyState title="No synchronized Jira issues" description="The linked Jira project currently has no issues available in the ResearchTrack snapshot." /> : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-slate-500"><span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">{rootCount} root items</span><span>{childCount} nested items</span>{tree.orphans.size ? <span>· {tree.orphans.size} parent(s) outside snapshot</span> : null}</div>
            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-100" aria-label="Filter Jira issues by type">
                <option value="all">All types</option><option value="epic">Epics</option><option value="story">Stories</option><option value="task">Tasks</option><option value="bug">Bugs</option><option value="subtask">Subtasks</option>
              </select>
              <label className="relative min-w-[220px] max-w-sm flex-1 sm:flex-none"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search key, issue, assignee…" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-100" /></label>
              <button type="button" onClick={() => setExpanded(expanded.size ? new Set() : new Set(expandable))} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50">{expanded.size ? <ChevronsDownUp className="h-4 w-4" /> : <ChevronsUpDown className="h-4 w-4" />}{expanded.size ? "Collapse all" : "Expand all"}</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="w-32 px-4 py-3">Key</th><th className="min-w-[420px] px-4 py-3">Issue hierarchy</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Assignee</th></tr></thead>
              <tbody>
                {rows.map(({ node, depth, matched }) => {
                  const issue = node.issue; const hasChildren = node.children.length > 0; const isOpen = normalizedQuery.length > 0 || expanded.has(issue.issueKey);
                  const toggle = () => { if (!hasChildren) return; setExpanded((current) => { const next = new Set(current); next.has(issue.issueKey) ? next.delete(issue.issueKey) : next.add(issue.issueKey); return next; }); };
                  const hierarchySurface = issue.issueType.toLowerCase() === "epic" ? "bg-violet-50/70 hover:bg-violet-100/60 border-l-4 border-l-violet-300" : depth === 1 ? "bg-slate-50/80 hover:bg-slate-100/80 border-l-4 border-l-sky-200" : "bg-white hover:bg-slate-50/80 border-l-4 border-l-transparent";
                  return <tr key={issue.issueKey} className={`group border-b border-slate-100 last:border-0 transition-colors ${matched ? "bg-amber-50/70" : hierarchySurface}`}>
                    <td className="px-4 py-3 align-top font-semibold"><button type="button" onClick={() => setSelectedIssue(issue)} className="text-left text-slate-800 underline-offset-2 hover:text-blue-700 hover:underline">{issue.issueKey}</button></td>
                    <td className="px-4 py-3 align-top">
                      <div className="relative flex min-h-10 items-start" style={{ paddingLeft: `${Math.min(depth, 6) * 28}px` }}>
                        {depth > 0 ? <span className="absolute top-0 h-5 w-4 rounded-bl-lg border-b border-l border-slate-200" style={{ left: `${Math.min(depth, 6) * 28 - 18}px` }} aria-hidden="true" /> : null}
                        <button type="button" disabled={!hasChildren} onClick={(event) => { event.stopPropagation(); toggle(); }} className={`mr-2 mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md transition ${hasChildren ? "text-slate-500 hover:bg-white/80 hover:text-slate-900" : "cursor-default text-slate-300"}`} aria-label={hasChildren ? `${isOpen ? "Collapse" : "Expand"} ${issue.issueKey}` : undefined}>{hasChildren ? (isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />) : <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />}</button>
                        <div className="min-w-0"><button type="button" onClick={() => setSelectedIssue(issue)} className="text-left font-medium leading-5 text-slate-900 underline-offset-2 hover:text-blue-700 hover:underline">{issue.summary}</button><div className="mt-1 flex flex-wrap items-center gap-1.5"><span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${typeTone(issue.issueType)}`}>{issue.issueType}</span>{issue.storyPoints != null ? <span className="text-xs text-slate-500">{issue.storyPoints} pts</span> : null}{hasChildren ? <span className="text-xs text-slate-400">· {node.children.length} direct {node.children.length === 1 ? "child" : "children"}</span> : null}{tree.orphans.has(issue.issueKey) ? <span className="text-xs text-amber-600">· parent {issue.parentIssueKey} not in snapshot</span> : null}</div></div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusClass(issue.statusCategory)}`}>{issue.status}</span></td>
                    <td className="px-4 py-3 align-top text-slate-600">{issue.priority ?? "—"}</td>
                    <td className="px-4 py-3 align-top text-slate-600"><JiraContributorIdentity accountId={issue.assigneeAccountId ?? issue.issueKey} displayName={issue.assigneeDisplayName} /></td>
                  </tr>;
                })}
                {rows.length === 0 ? <tr><td colSpan={5} className="px-6 py-12 text-center"><div className="font-medium text-slate-800">No matching Jira issues</div><div className="mt-1 text-sm text-slate-500">Try another key, title, status, priority, or assignee.</div></td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {selectedIssue ? <JiraIssueDetailsModal issue={selectedIssue} onClose={() => setSelectedIssue(null)} /> : null}
    </section>
  );
}
