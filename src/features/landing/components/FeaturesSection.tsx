import { ArrowUpRight, ClipboardCheck, GitPullRequest, ListChecks, MessagesSquare, Radar, UsersRound } from "lucide-react";
import type { LandingFeatureCard } from "../types";

export const FEATURE_CARDS: LandingFeatureCard[] = [
  { id: "project-health", icon: Radar, title: "Spot what needs attention", description: "Review project health, upcoming milestones, and signals that may need supervisor follow-up." },
  { id: "milestones", icon: ListChecks, title: "Keep milestones visible", description: "Make the project plan, responsibilities, and delivery checkpoints easier to follow." },
  { id: "development", icon: GitPullRequest, title: "See development evidence", description: "Explore connected GitHub activity and Jira work from the context of each project." },
  { id: "meetings", icon: MessagesSquare, title: "Keep decisions traceable", description: "Document meeting records and send student-submitted entries through supervisor review." },
  { id: "submissions", icon: ClipboardCheck, title: "Close the feedback loop", description: "Set research submission requirements, review uploaded work, and follow revisions." },
  { id: "teamwork", icon: UsersRound, title: "Give every role clarity", description: "Bring student collaboration and supervisor oversight into dedicated, connected workspaces." },
];

export function FeaturesSection() {
  return (
    <section id="features" aria-labelledby="features-heading" className="scroll-mt-24 bg-[#f6f8fb] py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl"><p className="landing-eyebrow">THE COMPLETE WORKFLOW</p><h2 id="features-heading" className="landing-section-heading">Everything behind better supervision, connected.</h2><p className="landing-section-copy">Research projects are more than their repositories. Connect the plan, the work, the conversations, and the decisions in one place.</p></div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_CARDS.map(({ id, icon: Icon, title, description }, index) => (
            <article key={id} className="group rounded-[22px] border border-slate-200/80 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-[0_18px_40px_-22px_rgba(19,65,112,.23)] sm:p-7">
              <div className="mb-10 flex items-start justify-between"><span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700"><Icon size={23} strokeWidth={1.8} aria-hidden="true" /></span><span className="text-xs font-semibold tabular-nums text-slate-300">0{index + 1}</span></div>
              <h3 className="text-lg font-bold tracking-tight text-slate-900">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
              <ArrowUpRight size={18} className="mt-5 text-sky-600 opacity-60 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" aria-hidden="true" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
