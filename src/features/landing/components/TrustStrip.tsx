import { GitBranch, LockKeyhole, MessageSquareCheck } from "lucide-react";

export function TrustStrip() {
  return (
    <section aria-label="Platform access and integration context" className="border-y border-slate-200 bg-white py-8">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-600"><LockKeyhole size={19} className="shrink-0 text-sky-700" aria-hidden="true"/> Role-specific student and supervisor workspaces</div>
        <div className="flex items-center gap-3 text-sm font-medium text-slate-600"><GitBranch size={19} className="shrink-0 text-sky-700" aria-hidden="true"/> GitHub and Jira connections when configured</div>
        <div className="flex items-center gap-3 text-sm font-medium text-slate-600"><MessageSquareCheck size={19} className="shrink-0 text-sky-700" aria-hidden="true"/> Reviewable research and meeting workflows</div>
      </div>
    </section>
  );
}
