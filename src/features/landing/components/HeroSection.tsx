import { ArrowDownRight, ArrowRight, CheckCircle2, MoveUpRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { BrandConstellation } from "./BrandConstellation";
import { ProductPreview } from "./ProductPreview";

type HeroSectionProps = { onRegister: () => void };

export function HeroSection({ onRegister }: HeroSectionProps) {
  return (
    <section className="relative isolate overflow-hidden bg-[#07152e] text-white" aria-labelledby="landing-heading">
      <div className="pointer-events-none absolute inset-0 opacity-80" aria-hidden="true" style={{ background: "radial-gradient(circle at 78% 12%, rgba(37,99,235,.28), transparent 35%), radial-gradient(circle at 5% 78%, rgba(14,165,233,.14), transparent 38%)" }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.055]" aria-hidden="true" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.4) 1px,transparent 1px)", backgroundSize: "64px 64px" }} />
      <div className="relative mx-auto w-full max-w-7xl px-4 pb-20 pt-14 sm:px-6 sm:pt-20 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="grid min-w-0 items-center gap-7 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,.92fr)] lg:gap-8">
          <div className="relative z-10 min-w-0">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-400/10 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-200"><span className="h-1.5 w-1.5 rounded-full bg-sky-400"/> Built for research teams</div>
            <h1 id="landing-heading" className="max-w-[710px] text-[clamp(2.7rem,4.7vw,4.65rem)] font-semibold leading-[1.09] tracking-[-0.052em]">One workspace.<br/><span className="text-sky-300">Complete visibility</span><br/> into every project.</h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">Connect students, supervisors, milestones, development activity, meetings, and submission reviews. See what&apos;s moving, what needs attention, and what comes next.</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button variant="marketing" size="lg" onClick={onRegister} className="h-12 rounded-xl px-6">Get started <ArrowRight size={17} aria-hidden="true" /></Button>
              <a href="#platform" className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/25 px-5 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300">Explore the platform <ArrowDownRight size={17} aria-hidden="true" /></a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-300">
              {['Supervisor oversight', 'Student collaboration', 'Connected project evidence'].map(label => <span key={label} className="inline-flex items-center gap-2"><CheckCircle2 size={15} className="text-sky-300" aria-hidden="true"/>{label}</span>)}
            </div>
          </div>
          <div className="min-w-0" data-testid="hero-brand-visual"><BrandConstellation /></div>
        </div>
        <div className="landing-preview-reveal relative mx-auto mt-10 max-w-6xl sm:mt-14 lg:mt-12">
          <div className="pointer-events-none absolute -inset-5 rounded-[32px] bg-sky-400/10 blur-3xl" aria-hidden="true" />
          <div className="relative"><ProductPreview /></div>
          <div className="pointer-events-none absolute -right-2 top-[13%] hidden items-center gap-2 rounded-xl border border-white/20 bg-[#152d51] px-4 py-3 text-xs font-medium text-sky-100 shadow-xl xl:flex"><MoveUpRight size={15} className="text-sky-300" aria-hidden="true"/> Know what needs review</div>
        </div>
        <p className="mt-5 text-xs text-slate-400">Preview styled after existing application workflows. All projects and metrics are fictional examples.</p>
      </div>
    </section>
  );
}
