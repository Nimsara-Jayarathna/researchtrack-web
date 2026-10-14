import { Search } from "lucide-react";

type DashboardSearchInputProps = {
  query: string;
  onChange: (next: string) => void;
};

export function DashboardSearchInput({
  query,
  onChange,
}: DashboardSearchInputProps) {
  return (
    <label className="relative block w-full min-w-0 max-w-md">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={query}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search projects"
        aria-label="Search supervised projects"
        className="h-11 w-full rounded-xl border border-slate-200 bg-white py-2 pl-11 pr-4 text-sm shadow-sm outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
      />
    </label>
  );
}
