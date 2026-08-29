import { Crown, ShieldCheck } from "lucide-react";
import { RoleBadge } from "@/components/ui/RoleBadge";
import type {
  StudentProjectDetailLeader,
  StudentProjectDetailMember,
} from "../../types";
import { memberDisplayName } from "../../utils/projectDetails/presentation";

type StudentProjectTeamTabProps = {
  members: StudentProjectDetailMember[];
  leader?: StudentProjectDetailLeader | null;
};

function memberOrder(
  member: StudentProjectDetailMember,
  leaderId: string | null,
): number {
  if (member.memberRole === "SUPERVISOR") return 0;
  if (leaderId && member.id === leaderId) return 1;
  return 2;
}

export function StudentProjectTeamTab({
  members,
  leader = null,
}: StudentProjectTeamTabProps) {
  const leaderId = leader?.id ?? null;
  const orderedMembers = [...members].sort(
    (left, right) => memberOrder(left, leaderId) - memberOrder(right, leaderId),
  );

  return (
    <section className="rounded-3xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-800">
            Project Team
          </h2>
          <p className="text-xs font-medium text-slate-400">
            Total {members.length} members assigned
          </p>
        </div>

        <div
          data-project-leader-summary
          className={`flex min-w-0 items-center gap-3 rounded-2xl border px-4 py-3 sm:max-w-sm ${
            leader
              ? "border-amber-200 bg-amber-50/70"
              : "border-slate-200 bg-slate-50/80"
          }`}
        >
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              leader
                ? "bg-amber-100 text-amber-700"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            <Crown className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Project leader
            </p>
            <p
              className={`truncate text-sm font-bold ${
                leader ? "text-slate-800" : "text-slate-500"
              }`}
              title={leader ? memberDisplayName(leader) : undefined}
            >
              {leader ? memberDisplayName(leader) : "Not assigned yet"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {orderedMembers.map((member) => {
          const isSupervisor = member.memberRole === "SUPERVISOR";
          const isLeader = member.memberRole === "STUDENT" && member.id === leaderId;

          return (
            <div
              key={member.id}
              data-member-role={member.memberRole}
              data-project-leader={isLeader ? "true" : "false"}
              className={`group relative overflow-hidden rounded-3xl border p-5 transition-all hover:shadow-lg ${
                isSupervisor
                  ? "border-indigo-100 bg-indigo-50/20"
                  : isLeader
                    ? "border-amber-200 bg-amber-50/25"
                    : "border-slate-100 bg-white"
              }`}
            >
              <div
                className={`absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10 transition-transform group-hover:scale-150 ${
                  isSupervisor
                    ? "bg-indigo-600"
                    : isLeader
                      ? "bg-amber-500"
                      : "bg-slate-400"
                }`}
              />

              {isLeader ? (
                <div
                  className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700"
                  aria-label="Project leader"
                  title="Project leader"
                >
                  <Crown className="h-3.5 w-3.5" aria-hidden />
                </div>
              ) : null}

              <div className="relative">
                <div className="flex items-center gap-3 pr-8">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xs font-black shadow-inner ${
                      isSupervisor
                        ? "bg-indigo-100 text-indigo-600"
                        : isLeader
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-50 text-slate-500"
                    }`}
                  >
                    {memberDisplayName(member).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-base font-black tracking-tight text-slate-800"
                      title={memberDisplayName(member)}
                    >
                      {memberDisplayName(member)}
                    </p>
                    <p
                      className="truncate text-xs font-bold text-slate-400 transition-colors group-hover:text-slate-600"
                      title={member.email}
                    >
                      {member.email}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <RoleBadge role={member.memberRole} />

                  {member.registrationNumber && (
                    <div className="flex items-center gap-1.5 rounded-xl border border-dotted border-slate-200 bg-slate-50/50 px-2.5 py-1 text-[10px] font-black tracking-tight text-slate-500">
                      <ShieldCheck className="h-3 w-3" />
                      {member.registrationNumber}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
