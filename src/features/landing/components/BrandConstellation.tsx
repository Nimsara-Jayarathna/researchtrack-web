import { CalendarCheck2, GitBranch, ListTodo, ShieldCheck } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";

/** Uses the actual ResearchTrack brand asset. Pure CSS animations; no canvas,
 * scroll listeners, 3D library, or requests. The central mark is not a link. */
const signals = [
  { label: "GitHub activity", icon: GitBranch, position: "left-top", delay: "0.1s" },
  { label: "Jira insights", icon: ListTodo, position: "right-top", delay: "0.35s" },
  { label: "Milestones", icon: CalendarCheck2, position: "left-bottom", delay: "0.55s" },
  { label: "Submission reviews", icon: ShieldCheck, position: "right-bottom", delay: "0.75s" },
] as const;

export function BrandConstellation() {
  return (
    <div className="landing-brand-stage relative mx-auto aspect-square w-full max-w-[440px] select-none" aria-label="ResearchTrack connects development activity, milestones, and supervision reviews">
      <div className="landing-brand-aura absolute inset-[17%] rounded-full bg-sky-400/20 blur-[65px]" aria-hidden="true" />
      <div className="landing-brand-ring landing-brand-ring-outer absolute inset-[7%] rounded-full border border-dashed border-sky-300/20" aria-hidden="true" />
      <div className="landing-brand-ring landing-brand-ring-inner absolute inset-[20%] rounded-full border border-sky-300/15" aria-hidden="true" />
      <div className="landing-brand-center absolute inset-[22%] flex items-center justify-center rounded-[32%] border border-sky-200/15 bg-[#0e2850]/65 shadow-[0_28px_80px_rgba(0,5,24,0.45),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md">
        <div className="absolute inset-4 rounded-[29%] border border-sky-300/10" aria-hidden="true" />
        <LogoMark className="landing-brand-logo relative z-10 !h-auto !w-[88%] drop-shadow-[0_12px_22px_rgba(0,152,255,0.28)]" size={225} />
      </div>
      {signals.map(({ label, icon: Icon, position, delay }) => (
        <div className={`landing-brand-signal landing-brand-signal-${position} absolute z-10 flex items-center gap-2 rounded-xl border border-sky-200/20 bg-[#132f55]/90 px-3 py-2.5 text-[10px] font-medium text-sky-50 shadow-[0_14px_35px_rgba(0,7,30,.22)] backdrop-blur-lg sm:text-[11px]`} key={label} style={{ animationDelay: delay }}>
          <Icon size={14} className="shrink-0 text-sky-300" aria-hidden="true" />
          <span>{label}</span>
        </div>
      ))}
      <div className="landing-brand-spark landing-brand-spark-one absolute left-[50%] top-[5%] h-2.5 w-2.5 rounded-full bg-sky-300 shadow-[0_0_18px_#7dd3fc]" aria-hidden="true" />
      <div className="landing-brand-spark landing-brand-spark-two absolute bottom-[9%] right-[19%] h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_14px_#6ee7b7]" aria-hidden="true" />
    </div>
  );
}
