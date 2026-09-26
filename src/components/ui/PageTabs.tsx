import { cn } from "@/lib/cn";

type PageTabItem = {
  value: string;
  label: string;
};

type PageTabsProps = {
  items: PageTabItem[];
  value: string;
  onChange: (value: string) => void;
  tone?: "student" | "supervisor" | "neutral";
  className?: string;
};

const ACTIVE_TONE_CLASSES = {
  student: "bg-sky-600 text-white",
  supervisor: "bg-slate-900 text-white",
  neutral: "bg-slate-900 text-white",
} as const;

export function PageTabs({
  items,
  value,
  onChange,
  tone = "neutral",
  className,
}: PageTabsProps) {
  return (
    <section
      aria-label="Project sections"
      className={cn(
        "rounded-3xl border border-border bg-white p-3 shadow-sm",
        className,
      )}
    >
      <div className="-mx-1 overflow-x-auto px-1">
        <div
          className="inline-flex min-w-full gap-1.5 sm:flex sm:flex-wrap"
          role="tablist"
          aria-orientation="horizontal"
        >
          {items.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange(item.value)}
              role="tab"
              aria-selected={value === item.value}
              tabIndex={value === item.value ? 0 : -1}
              className={cn(
                "min-h-10 shrink-0 whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2",
                value === item.value
                  ? ACTIVE_TONE_CLASSES[tone]
                  : "bg-transparent text-muted-foreground hover:bg-slate-100 hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
