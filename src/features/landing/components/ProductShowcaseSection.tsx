import { ArrowUpRight, ChartNoAxesCombined, GitBranch, Layers3, ShieldCheck } from "lucide-react";
import { ProjectJourneyPreview } from "./ProjectJourneyPreview";

export function ProductShowcaseSection() {
  return (
    <section id="platform" aria-labelledby="platform-heading" className="scroll-mt-24 bg-white py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[0.76fr_1.24fr] lg:gap-16">
          <div><p className="landing-eyebrow">A CLEARER VIEW</p><h2 id="platform-heading" className="landing-section-heading">Less chasing updates. More time guiding progress.</h2><p className="landing-section-copy">Move from scattered status checks to a connected view of your research portfolio. ResearchTrack surfaces the work that is progressing — and the projects that deserve a closer look.</p>
            <ul className="mt-8 space-y-5">
              {[{ icon: ChartNoAxesCombined, title: "A portfolio-level perspective", body: "Review active projects, attention signals, and upcoming milestones." }, { icon: Layers3, title: "Project-level context", body: "Explore team activity, tasks, meeting records, and submissions together." }, { icon: ShieldCheck, title: "Decisions with context", body: "Follow up with feedback and reviews inside the project workflow." }].map(({ icon: Icon, title, body }) => <li key={title} className="flex items-start gap-3"><div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><Icon size={18} aria-hidden="true" /></div><div><h3 className="text-sm font-bold text-slate-900">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{body}</p></div></li>)}
            </ul>
            <a href="#workflow" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-sky-700 hover:text-sky-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-600">See how it comes together <ArrowUpRight size={16} aria-hidden="true"/></a>
          </div>
          <div className="relative"><div className="absolute -inset-7 rounded-[48px] bg-gradient-to-br from-sky-100 via-slate-50 to-indigo-100 opacity-80" aria-hidden="true"/><div className="relative"><ProjectJourneyPreview /></div><div className="relative mt-4 inline-flex items-center gap-2 text-xs text-slate-500"><GitBranch size={14} aria-hidden="true"/> App-inspired project preview with fictional sample details, not live information.</div></div>
        </div>
      </div>
    </section>
  );
}
