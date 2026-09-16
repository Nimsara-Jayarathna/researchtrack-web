import { ArrowRight } from "lucide-react";

type GithubBranchRouteProps = {
  sourceBranch: string;
  targetBranch: string;
  variant?: "card" | "detail";
};

type ParsedBranch = {
  owner: string | null;
  branch: string;
  full: string;
};

function parseBranch(value: string): ParsedBranch {
  const full = value.trim() || "unknown";
  const separator = full.indexOf(":");
  if (separator <= 0 || separator === full.length - 1) {
    return { owner: null, branch: full, full };
  }

  return {
    owner: full.slice(0, separator),
    branch: full.slice(separator + 1),
    full,
  };
}

function BranchTag({
  label,
  value,
  tone,
  compact,
}: {
  label: string;
  value: ParsedBranch;
  tone: "source" | "target";
  compact: boolean;
}) {
  const toneClass =
    tone === "source"
      ? "border-indigo-100 bg-indigo-50/70 text-indigo-800"
      : "border-violet-100 bg-violet-50/70 text-violet-800";

  return (
    <div className="min-w-0">
      <p className="mb-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <div
        className={`min-w-0 rounded-xl border ${toneClass} ${
          compact ? "px-2.5 py-2" : "px-3 py-2.5"
        }`}
        title={value.full}
      >
        {value.owner ? (
          <p className="truncate text-[9px] font-bold text-slate-400">
            {value.owner}
          </p>
        ) : null}
        <p
          className={`truncate font-mono font-bold ${
            compact ? "text-[10px]" : "text-xs"
          }`}
        >
          {value.branch}
        </p>
      </div>
    </div>
  );
}

export function GithubBranchRoute({
  sourceBranch,
  targetBranch,
  variant = "card",
}: GithubBranchRouteProps) {
  const source = parseBranch(sourceBranch);
  const target = parseBranch(targetBranch);
  const compact = variant === "card";

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
      <BranchTag
        label="Source"
        value={source}
        tone="source"
        compact={compact}
      />
      <div
        className={`flex shrink-0 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-400 shadow-sm ${
          compact ? "mb-1 h-7 w-7" : "mb-1 h-8 w-8"
        }`}
        aria-hidden="true"
      >
        <ArrowRight className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </div>
      <BranchTag
        label="Target"
        value={target}
        tone="target"
        compact={compact}
      />
    </div>
  );
}
