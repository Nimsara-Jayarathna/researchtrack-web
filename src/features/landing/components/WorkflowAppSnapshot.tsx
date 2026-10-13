import {
  AlertCircle,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  FileCheck2,
  GitBranch,
  GitPullRequest,
  Plus,
  Users,
} from "lucide-react";
import {
  PreviewCard,
  PreviewStatus,
  PreviewTabs,
  PreviewWindow,
} from "./AppPreviewUI";

type Stage = "plan" | "connect" | "collaborate" | "review";

function SetupSnapshot() {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-sky-700">
            Supervisor workspace / Projects
          </p>
          <h4 className="mt-1 text-base font-semibold text-slate-950">
            Create research project
          </h4>
        </div>
        <PreviewStatus tone="info">Step 2 of 3</PreviewStatus>
      </div>
      <div className="mt-3">
        <PreviewTabs
          selected="Students"
          tabs={["Basics", "Students", "Milestones"]}
        />
      </div>
      <PreviewCard className="mt-3">
        <div className="flex items-center justify-between gap-2">
          <h5 className="text-xs font-semibold text-slate-800">
            Assign research team
          </h5>
          <span className="text-[10px] text-indigo-600">Supervisor setup</span>
        </div>
        <div className="mt-3 space-y-2">
          {[
            { initial: "A", name: "Alex Perera", role: "Team leader" },
            { initial: "S", name: "Sam Fernando", role: "Student" },
          ].map((person) => (
            <div
              key={person.name}
              className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-700">
                {person.initial}
              </span>
              <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-slate-800">
                {person.name}
              </span>
              <span className="text-[10px] text-slate-500">{person.role}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-indigo-200 px-3 py-2 text-[10px] font-semibold text-indigo-700">
          <Plus size={13} aria-hidden="true" /> Add student
        </div>
      </PreviewCard>
      <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
        <CalendarClock size={13} aria-hidden="true" /> Define milestones in the
        next step
      </div>
    </>
  );
}

function ConnectSnapshot() {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-sky-700">
            Project Horizon / Integrations
          </p>
          <h4 className="mt-1 text-base font-semibold text-slate-950">
            Connected project activity
          </h4>
        </div>
        <PreviewStatus tone="success">Connected</PreviewStatus>
      </div>
      <div className="mt-3">
        <PreviewTabs
          selected="GitHub"
          tabs={["Overview", "GitHub", "Jira", "Integrations"]}
        />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <PreviewCard>
          <div className="flex items-center gap-2">
            <GitBranch
              size={16}
              className="text-indigo-600"
              aria-hidden="true"
            />
            <h5 className="text-xs font-semibold text-slate-800">
              GitHub repositories
            </h5>
          </div>
          <p className="mt-2 text-[10px] text-slate-500">
            researchtrack / frontend
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-slate-50 p-2">
              <p className="text-lg font-bold text-slate-900">26</p>
              <p className="text-[9px] text-slate-500">Commits</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2">
              <p className="text-lg font-bold text-slate-900">04</p>
              <p className="text-[9px] text-slate-500">Contributors</p>
            </div>
          </div>
        </PreviewCard>
        <PreviewCard>
          <div className="flex items-center gap-2">
            <GitPullRequest
              size={16}
              className="text-sky-600"
              aria-hidden="true"
            />
            <h5 className="text-xs font-semibold text-slate-800">
              Jira health
            </h5>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-500">Sprint progress</span>
            <strong className="text-[11px] text-slate-900">72%</strong>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-[72%] rounded-full bg-sky-500" />
          </div>
          <div className="mt-4">
            <PreviewStatus tone="info">Issues & workload</PreviewStatus>
          </div>
        </PreviewCard>
      </div>
      <p className="mt-3 text-[10px] text-slate-500">
        Analytics are shown in dedicated GitHub and Jira project tabs.
      </p>
    </>
  );
}

function MeetingSnapshot() {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-sky-700">
            Project Horizon / Meetings
          </p>
          <h4 className="mt-1 text-base font-semibold text-slate-950">
            Meeting insights
          </h4>
        </div>
        <PreviewStatus tone="warning">Review pending</PreviewStatus>
      </div>
      <div className="mt-3">
        <PreviewTabs selected="History" tabs={["Channels", "History"]} />
      </div>
      <PreviewCard className="mt-3">
        <div className="flex items-center justify-between gap-2">
          <h5 className="text-xs font-semibold text-slate-800">
            Meeting records
          </h5>
          <span className="text-[10px] text-slate-500">Team activity</span>
        </div>
        <div className="mt-3 space-y-2">
          {[
            {
              title: "Weekly research check-in",
              detail: "Progress notes and action items",
              tone: "warning" as const,
              status: "Pending approval",
              icon: Clock3,
            },
            {
              title: "Requirements discussion",
              detail: "Previous supervision session",
              tone: "success" as const,
              status: "Approved",
              icon: CheckCircle2,
            },
          ].map((record) => (
            <div
              key={record.title}
              className="flex flex-wrap items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50 p-3"
            >
              <record.icon
                size={16}
                className="text-sky-700"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-slate-800">
                  {record.title}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  {record.detail}
                </p>
              </div>
              <PreviewStatus tone={record.tone}>{record.status}</PreviewStatus>
            </div>
          ))}
        </div>
      </PreviewCard>
      <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
        <Users size={13} aria-hidden="true" /> Students submit meeting records
        for supervisor review
      </div>
    </>
  );
}

function SubmissionSnapshot() {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-sky-700">
            Project Horizon / Submissions
          </p>
          <h4 className="mt-1 text-base font-semibold text-slate-950">
            Research Submissions
          </h4>
        </div>
        <PreviewStatus tone="warning">Needs review: 1</PreviewStatus>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[
          {
            label: "Needs review",
            value: "01",
            tone: "border-amber-200 bg-amber-50",
          },
          {
            label: "Waiting for revision",
            value: "01",
            tone: "border-sky-200 bg-sky-50",
          },
        ].map((item) => (
          <div
            key={item.label}
            className={`rounded-xl border p-3 ${item.tone}`}
          >
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
              {item.label}
            </p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {item.value}
            </p>
          </div>
        ))}
      </div>
      <PreviewCard className="mt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <FileCheck2
              size={14}
              className="text-amber-700"
              aria-hidden="true"
            />{" "}
            Needs review
          </span>
          <PreviewStatus tone="warning">1 submission</PreviewStatus>
        </div>
        <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/40 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold text-slate-800">
                Research proposal
              </p>
              <p className="mt-1 text-[10px] text-slate-500">
                Version 2 · Uploaded for review
              </p>
            </div>
            <PreviewStatus tone="warning">
              <AlertCircle size={10} className="mr-1" aria-hidden="true" />
              Pending review
            </PreviewStatus>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-emerald-700">
          <Check size={12} aria-hidden="true" /> Feedback and revision history
          stay with the submission
        </div>
      </PreviewCard>
    </>
  );
}

const stageContent = {
  plan: SetupSnapshot,
  connect: ConnectSnapshot,
  collaborate: MeetingSnapshot,
  review: SubmissionSnapshot,
};
const stageLabels = {
  plan: "Project setup",
  connect: "GitHub and Jira",
  collaborate: "Meeting records",
  review: "Submission reviews",
};

/** Real application-shaped previews; visually non-interactive by design. */
export function WorkflowAppSnapshot({ stage }: { stage: Stage }) {
  const StageContent = stageContent[stage];
  return (
    <div className="relative min-w-0 rounded-[28px] border border-slate-200 bg-gradient-to-br from-sky-50 via-slate-50 to-indigo-50 p-3 sm:p-5">
      <PreviewWindow title={stageLabels[stage]} compact>
        <StageContent />
      </PreviewWindow>
    </div>
  );
}
