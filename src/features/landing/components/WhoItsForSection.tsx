import { ArrowUpRight, Check, GraduationCap, UsersRound } from "lucide-react";
import type { LandingAudienceCard } from "../types";

export const AUDIENCES: LandingAudienceCard[] = [
  { id: "supervisors", icon: GraduationCap, title: "For supervisors", items: ["Oversee multiple research projects", "Prioritize milestone and project risks", "Review meeting records and submissions", "Provide clear feedback and decisions"] },
  { id: "students", icon: UsersRound, title: "For student teams", items: ["Understand assigned project milestones", "See connected project development activity", "Document meeting outcomes", "Submit work and follow supervisor feedback"] },
];

export function WhoItsForSection() {
  return (
    <section id="audiences" aria-labelledby="audiences-heading" className="scroll-mt-24 bg-white py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl"><p className="landing-eyebrow">BUILT AROUND PEOPLE</p><h2 id="audiences-heading" className="landing-section-heading">One platform. Two perspectives that work together.</h2><p className="landing-section-copy">Students and supervisors need different views of the same research journey. ResearchTrack is designed for both.</p></div>
        <div className="mt-12 grid gap-5 md:grid-cols-2">{AUDIENCES.map(({ id, icon: Icon, title, items }) => <article key={id} className={`rounded-[28px] border p-7 sm:p-9 ${id === "supervisors" ? "border-[#193455] bg-[#0c2342] text-white" : "border-slate-200 bg-slate-50 text-slate-950"}`}><div className={`mb-8 flex h-14 w-14 items-center justify-center rounded-2xl p-3 ${id === "supervisors" ? "bg-sky-400/20 text-sky-200" : "bg-sky-100 text-sky-700"}`}><Icon size={25} aria-hidden="true"/></div><h3 className="text-2xl font-bold tracking-tight">{title}</h3><ul className="mt-8 space-y-4">{items.map((item) => <li key={item} className="flex items-start gap-3 text-sm leading-6"><Check size={18} className={id === "supervisors" ? "mt-0.5 shrink-0 text-sky-300" : "mt-0.5 shrink-0 text-sky-700"} aria-hidden="true"/><span className={id === "supervisors" ? "text-slate-200" : "text-slate-600"}>{item}</span></li>)}</ul><a href="#get-started" className={`mt-9 inline-flex items-center gap-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 ${id === "supervisors" ? "text-sky-200 hover:text-white" : "text-sky-700 hover:text-sky-900"}`}>Get started <ArrowUpRight size={16} aria-hidden="true"/></a></article>)}</div>
      </div>
    </section>
  );
}
