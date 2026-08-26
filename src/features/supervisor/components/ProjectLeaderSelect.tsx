import type { SupervisorProjectDetailMember } from "../types";

type ProjectLeaderSelectProps = {
  projectId: string;
  currentLeader: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    registrationNumber: string | null;
  } | null;
  availableLeaders: SupervisorProjectDetailMember[];
  leaderDraftId: string;
  onLeaderChange: (leaderId: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
};

export function ProjectLeaderSelect({
  currentLeader,
  availableLeaders,
  leaderDraftId,
  onLeaderChange,
  onSubmit,
  isLoading,
}: ProjectLeaderSelectProps) {
  const hasChanges = leaderDraftId !== (currentLeader?.id ?? "");

  return (
    <div>
      <label
        htmlFor="project-leader"
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        Select Project Leader
      </label>

      <select
        id="project-leader"
        value={leaderDraftId}
        onChange={(event) => onLeaderChange(event.target.value)}
        disabled={isLoading || availableLeaders.length === 0}
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        <option value="">
          Select a student
        </option>

        {availableLeaders.map((student) => (
          <option key={student.id} value={student.id}>
            {student.firstName ?? ""} {student.lastName ?? ""}
            {student.registrationNumber
              ? ` (${student.registrationNumber})`
              : ""}
          </option>
        ))}
      </select>

      {currentLeader && (
        <p className="mt-2 text-sm text-slate-500">
          Current leader:{" "}
          <span className="font-medium text-slate-700">
            {currentLeader.firstName ?? ""}{" "}
            {currentLeader.lastName ?? ""}
          </span>
        </p>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onSubmit}
          disabled={
            isLoading ||
            !leaderDraftId ||
            !hasChanges
          }
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Updating..." : "Update Leader"}
        </button>
      </div>
    </div>
  );
}