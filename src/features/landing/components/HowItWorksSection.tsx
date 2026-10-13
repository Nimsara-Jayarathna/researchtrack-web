import { FolderPlus, GitBranch, MessagesSquare, ScanEye } from "lucide-react";
import type { LandingStepCard } from "../types";

export const STEPS: LandingStepCard[] = [
  { id: "setup", stepNumber: 1, icon: FolderPlus, title: "Set up the project", description: "A supervisor creates the project, establishes the team, and defines milestones." },
  { id: "connect", stepNumber: 2, icon: GitBranch, title: "Connect the work", description: "Link GitHub repositories or Jira where integrations are configured and permitted." },
  { id: "collaborate", stepNumber: 3, icon: MessagesSquare, title: "Collaborate & deliver", description: "Students work toward milestones, record meetings, and submit required research material." },
  { id: "review", stepNumber: 4, icon: ScanEye, title: "Review & guide", description: "Supervisors check health signals, review submissions, and provide feedback." },
];

export function HowItWorksSection() {
  return (
    <section id="steps" aria-labelledby="steps-heading" className="bg-[#f6f8fb] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl"><p className="landing-eyebrow">GETTING TO WORK</p><h2 id="steps-heading" className="landing-section-heading">Simple to follow. Connected by design.</h2></div>
        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ id, icon: Icon, stepNumber, title, description }) => <li key={id} className="relative rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-center justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white"><Icon size={19} aria-hidden="true"/></span><span className="text-sm font-semibold text-slate-400">0{stepNumber}</span></div><h3 className="mt-7 text-base font-bold text-slate-950">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{description}</p></li>)}
        </ol>
      </div>
    </section>
  );
}
