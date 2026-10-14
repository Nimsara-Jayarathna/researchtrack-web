import { ProgressMeter } from "@/components/ui/ProgressMeter";

type StudentProjectDetailsKpisProps = {
  batch: string | null;
  semester: string | null;
  milestonesCount: number;
  progressPercent: number | null;
};

export function StudentProjectDetailsKpis({
  batch,
  semester,
  milestonesCount,
  progressPercent,
}: StudentProjectDetailsKpisProps) {
  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[
        { label: "Batch", value: batch ?? "Not set" },
        { label: "Semester", value: semester ?? "Not set" },
        { label: "Milestones", value: String(milestonesCount) },
        {
          label: "Progress",
          value:
            progressPercent == null ? "Not reported" : `${progressPercent}%`,
        },
      ].map(({ label, value }) => (
        <div
          key={label}
          className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-4"
        >
          <p className="text-xs font-semibold tracking-normal text-slate-500">
            {label}
          </p>
          <p
            className="mt-2 truncate text-xl font-semibold text-slate-900"
            title={value}
          >
            {value}
          </p>
          {label === "Progress" ? (
            <ProgressMeter value={progressPercent} compact className="mt-2" />
          ) : null}
        </div>
      ))}
    </section>
  );
}
