import { CalendarCheck2, CheckCheck, FileClock, GitPullRequest, MessageCircleMore, Workflow } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type WorkflowStory = {
  number: string;
  eyebrow: string;
  heading: string;
  description: string;
  points: string[];
  icon: LucideIcon;
  color: string;
};

const stories: WorkflowStory[] = [
  { number: "01", eyebrow: "PLAN", heading: "Start with a shared project plan.", description: "Supervisors establish projects, teams, and milestone expectations so everyone can work from the same plan.", points: ["Supervisor-led project setup", "Team responsibilities", "Milestone visibility"], icon: CalendarCheck2, color: "bg-sky-50 text-sky-700" },
  { number: "02", eyebrow: "CONNECT", heading: "Put development activity in context.", description: "When repositories and Jira projects are connected, view contributions, pull requests, sprint status, and issue progress alongside research delivery.", points: ["GitHub repositories and contributors", "Jira work and sprint signals", "Project-linked insights"], icon: GitPullRequest, color: "bg-indigo-50 text-indigo-700" },
  { number: "03", eyebrow: "COLLABORATE", heading: "Keep the supervision conversation moving.", description: "Manage meeting records and channel proposals, with student-submitted entries available for supervisor review.", points: ["Meeting record submissions", "Supervisor approvals", "Shared project context"], icon: MessageCircleMore, color: "bg-amber-50 text-amber-800" },
  { number: "04", eyebrow: "REVIEW", heading: "Turn every submission into the next step.", description: "Define required deliverables, collect student uploads, and give feedback through review decisions and a revision trail.", points: ["Submission requirements and dates", "Review decisions and feedback", "Version history for revisions"], icon: FileClock, color: "bg-emerald-50 text-emerald-700" },
];

function StoryVisual({ story, index }: { story: WorkflowStory; index: number }) {
  const Icon = story.icon;
  const status = ["Project ready", "Connected evidence", "For review", "Feedback recorded"][index];
  return (
    <div aria-label={`${story.eyebrow} workflow illustration`} className="relative flex min-h-[245px] items-center justify-center overflow-hidden rounded-[25px] border border-slate-200 bg-[#f5f8fc] p-6 sm:min-h-[280px]">
      <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-sky-200/50 blur-3xl" aria-hidden="true"/>
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_44px_-23px_rgba(22,50,95,.26)]">
        <div className="flex items-center justify-between"><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${story.color}`}><Icon size={22} aria-hidden="true" /></span><span className="rounded-full border border-slate-200 px-3 py-1.5 text-[10px] font-semibold text-slate-500">STAGE {story.number}</span></div>
        <h4 className="mt-5 text-sm font-bold text-slate-950">{["Research project workspace", "Project activity overview", "Meeting record workflow", "Submission review"][index]}</h4>
        <p className="mt-1 text-xs text-slate-500">Example of the supported workflow</p>
        <div className="mt-5 space-y-2.5">{story.points.map((point, i) => <div key={point} className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5"><div className={`flex h-5 w-5 items-center justify-center rounded-md ${story.color}`}>{i === 2 ? <CheckCheck size={12} aria-hidden="true"/> : <span className="text-[10px] font-bold">{i + 1}</span>}</div><span className="text-[11px] font-medium text-slate-700">{point}</span></div>)}</div>
        <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-[10px] font-semibold text-slate-600"><span className="h-2 w-2 rounded-full bg-emerald-500" /> {status}<Workflow size={13} className="ml-auto text-slate-400" aria-hidden="true" /></div>
      </div>
    </div>
  );
}

export function WorkflowShowcaseSection() {
  return (
    <section id="workflow" aria-labelledby="workflow-heading" className="scroll-mt-24 bg-white py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl"><p className="landing-eyebrow">A CONNECTED PROCESS</p><h2 id="workflow-heading" className="landing-section-heading">From the first milestone to the final review.</h2><p className="landing-section-copy">The useful part isn&apos;t any single feature. It&apos;s how each step feeds the next.</p></div>
        <div className="mt-14 space-y-16 lg:space-y-24">
          {stories.map((story, index) => <article key={story.number} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-20"><div className={index % 2 ? "lg:order-2" : ""}><div className="mb-5 flex items-center gap-3"><span className="text-3xl font-light text-sky-600">{story.number}</span><span className="h-px w-10 bg-slate-300"/><span className="landing-eyebrow !mb-0">{story.eyebrow}</span></div><h3 className="max-w-md text-3xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-4xl">{story.heading}</h3><p className="mt-5 max-w-lg text-base leading-8 text-slate-600">{story.description}</p><ul className="mt-7 space-y-3">{story.points.map((point) => <li key={point} className="flex items-center gap-3 text-sm font-medium text-slate-700"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-50 text-sky-700"><CheckCheck size={14} aria-hidden="true"/></span>{point}</li>)}</ul></div><div className={index % 2 ? "lg:order-1" : ""}><StoryVisual story={story} index={index} /></div></article>)}
        </div>
      </div>
    </section>
  );
}
