import { CheckCheck } from "lucide-react";
import { WorkflowAppSnapshot } from "./WorkflowAppSnapshot";

const stories = [
  {
    number: "01",
    stage: "plan" as const,
    eyebrow: "PLAN",
    heading: "Start with a shared project plan.",
    description:
      "Supervisors establish projects, teams, and milestone expectations so everyone can work from the same plan.",
    points: [
      "Supervisor-led project setup",
      "Team responsibilities",
      "Milestone visibility",
    ],
  },
  {
    number: "02",
    stage: "connect" as const,
    eyebrow: "CONNECT",
    heading: "Put development activity in context.",
    description:
      "When repositories and Jira projects are connected, view contributions, pull requests, sprint status, and issue progress alongside research delivery.",
    points: [
      "GitHub repositories and contributors",
      "Jira work and sprint signals",
      "Project-linked insights",
    ],
  },
  {
    number: "03",
    stage: "collaborate" as const,
    eyebrow: "COLLABORATE",
    heading: "Keep the supervision conversation moving.",
    description:
      "Manage meeting records and channel proposals, with student-submitted entries available for supervisor review.",
    points: [
      "Meeting record submissions",
      "Supervisor approvals",
      "Shared project context",
    ],
  },
  {
    number: "04",
    stage: "review" as const,
    eyebrow: "REVIEW",
    heading: "Turn every submission into the next step.",
    description:
      "Define required deliverables, collect student uploads, and give feedback through review decisions and a revision trail.",
    points: [
      "Submission requirements and dates",
      "Review decisions and feedback",
      "Version history for revisions",
    ],
  },
];

export function WorkflowShowcaseSection() {
  return (
    <section
      id="workflow"
      aria-labelledby="workflow-heading"
      className="scroll-mt-24 bg-white py-20 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="landing-eyebrow">A CONNECTED PROCESS</p>
          <h2 id="workflow-heading" className="landing-section-heading">
            From the first milestone to the final review.
          </h2>
          <p className="landing-section-copy">
            The useful part isn&apos;t any single feature. It&apos;s how each
            step feeds the next.
          </p>
        </div>
        <div className="mt-14 space-y-16 lg:space-y-24">
          {stories.map((story, index) => (
            <article
              key={story.number}
              className="grid min-w-0 items-center gap-8 lg:grid-cols-2 lg:gap-14"
            >
              <div className={index % 2 ? "lg:order-2" : ""}>
                <div className="mb-5 flex items-center gap-3">
                  <span className="text-3xl font-light text-sky-600">
                    {story.number}
                  </span>
                  <span className="h-px w-10 bg-slate-300" />
                  <span className="landing-eyebrow !mb-0">{story.eyebrow}</span>
                </div>
                <h3 className="max-w-md text-3xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-4xl">
                  {story.heading}
                </h3>
                <p className="mt-5 max-w-lg text-base leading-8 text-slate-600">
                  {story.description}
                </p>
                <ul className="mt-7 space-y-3">
                  {story.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-center gap-3 text-sm font-medium text-slate-700"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-700">
                        <CheckCheck size={14} aria-hidden="true" />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`min-w-0 ${index % 2 ? "lg:order-1" : ""}`}>
                <WorkflowAppSnapshot stage={story.stage} />
              </div>
            </article>
          ))}
        </div>
        <p className="mt-10 text-xs text-slate-500">
          Previews reproduce the structure of existing project workflows with
          fictional sample content; they are not interactive product screens.
        </p>
      </div>
    </section>
  );
}
