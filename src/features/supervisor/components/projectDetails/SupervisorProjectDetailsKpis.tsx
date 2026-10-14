import { ProgressMeter } from "@/components/ui/ProgressMeter";

type ProjectDetailsKpisProps = {
  batch: string | null;
  semester: string | null;
  milestonesCount: number;
  progressPercent: number | null;
};

export function SupervisorProjectDetailsKpis({
  batch,
  semester,
  milestonesCount,
  progressPercent,
}: ProjectDetailsKpisProps) {
  const details = [
    { label: "Batch", value: batch ?? "Not set" },
    { label: "Semester", value: semester ?? "Not set" },
    { label: "Milestones", value: String(milestonesCount) },
  ];
  return (
    <section
      aria-label="Project facts"
      className="grid grid-cols-2 gap-2 lg:grid-cols-4"
    >
      {details.map(({ label, value }) => (
        <div
          key={label}
          className="min-w-0 rounded-xl bg-slate-50 px-3 py-2.5 sm:px-4"
        >
          <p className="text-[11px] font-medium text-slate-500">{label}</p>
          <p
            className="mt-1 truncate text-base font-semibold text-slate-900"
            title={value}
          >
            {value}
          </p>
        </div>
      ))}
      <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2.5 sm:px-4">
        <ProgressMeter value={progressPercent} compact={false} />
      </div>
    </section>
  );
}
