import { ArrowDownRight, ArrowRight, CheckCircle2, MoveUpRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProductPreview } from "./ProductPreview";

type HeroSectionProps = { onRegister: () => void };

export function HeroSection({ onRegister }: HeroSectionProps) {
  return (
    <section className="relative isolate overflow-hidden bg-[#07152e] text-white" aria-labelledby="landing-heading">
      <div className="pointer-events-none absolute inset-0 opacity-80" aria-hidden="true" style={{ background: "radial-gradient(circle at 78% 12%, rgba(37,99,235,.28), transparent 34%), radial-gradient(circle at 5% 85%, rgba(14,165,233,.14), transparent 38%)" }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.055]" aria-hidden="true" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.4) 1px,transparent 1px)", backgroundSize: "64px 64px" }} />
      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 sm:pt-24 lg:px-8 lg:pb-28 lg:pt-28">
        <div className="max-w-4xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-400/10 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-200"><span className="h-1.5 w-1.5 rounded-full bg-sky-400"/> Built for research teams</div>
          <h1 id="landing-heading" className="max-w-4xl text-[clamp(2.8rem,5.8vw,5.8rem)] font-semibold leading-[1.06] tracking-[-0.055em]">One workspace.<br/><span className="text-sky-300">Complete visibility</span><br/> into every project.</h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">Connect students, supervisors, milestones, development activity, meetings, and submission reviews. See what&apos;s moving, what needs attention, and what comes next.</p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button variant="marketing" size="lg" onClick={onRegister} className="h-12 rounded-xl px-6">Get started <ArrowRight size={17} aria-hidden="true" /></Button>
            <a href="#platform" className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/25 px-5 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300">Explore the platform <ArrowDownRight size={17} aria-hidden="true" /></a>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-300"><span className="inline-flex items-center gap-2"><CheckCircle2 size={15} className="text-sky-300"/> Supervisor oversight</span><span className="inline-flex items-center gap-2"><CheckCircle2 size={15} className="text-sky-300"/> Student collaboration</span><span className="inline-flex items-center gap-2"><CheckCircle2 size={15} className="text-sky-300"/> Connected project evidence</span></div>
        </div>
        <div className="relative mt-16 max-w-5xl lg:mt-20"><div className="absolute -inset-5 rounded-[32px] bg-sky-400/10 blur-3xl"/><div className="relative"><ProductPreview /></div><div className="pointer-events-none absolute -right-4 top-[15%] hidden items-center gap-2 rounded-xl border border-white/20 bg-[#152d51] px-4 py-3 text-xs font-medium text-sky-100 shadow-xl xl:flex"><MoveUpRight size={15} className="text-sky-300"/> Know what needs review</div></div>
        <p className="mt-5 text-xs text-slate-400">A closer look at the supervision experience — illustration, not live project data.</p>
      </div>
    </section>
  );
}
