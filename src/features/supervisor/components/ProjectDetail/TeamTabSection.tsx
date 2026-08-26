import { useCallback, useMemo } from "react";
import { X } from "lucide-react";

import { BlockingState } from "@/components/ui/BlockingState";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

import type { TeamState } from "../../hooks/projectDetails/useProjectTeamState";

import type {
  SupervisorProjectDetail,
  SupervisorStudentSearchResult,
} from "../../types";

type TeamTabSectionProps = {
  project: SupervisorProjectDetail;
  team: TeamState;
};

export function TeamTabSection({
  project,
  team,
}: TeamTabSectionProps) {
  const isSupervisor = true;

  const buildStudentLabel = useCallback(
    (student: SupervisorStudentSearchResult) => {
      const fullName =
        `${student.firstName ?? ""} ${student.lastName ?? ""}`.trim();

      return fullName || student.email;
    },
    [],
  );

  const excludedStudentIds = useMemo(() => {
    return new Set<string>([
      ...team.studentMembers.map(
        (member) => member.id,
      ),
      ...team.selectedStudentsToAdd.map(
        (student) => student.id,
      ),
    ]);
  }, [
    team.studentMembers,
    team.selectedStudentsToAdd,
  ]);

  const visibleSearchResults = useMemo(() => {
    return team.studentSearchResults.filter(
      (student) =>
        !excludedStudentIds.has(student.id),
    );
  }, [
    team.studentSearchResults,
    excludedStudentIds,
  ]);

  const handleStudentSearch = useCallback(
    (query: string) => {
      team.setStudentQuery(query);
    },
    [team],
  );

  const handleAddStudent = useCallback(
    (student: SupervisorStudentSearchResult) => {
      team.selectStudentToAdd(student);
    },
    [team],
  );

  const handleRemoveSelected = useCallback(
    (studentId: string) => {
      team.removeSelectedStudent(studentId);
    },
    [team],
  );

  const handleAddStudents = useCallback(() => {
    team.addStudents();
  }, [team]);

  const handleCancelManagement = useCallback(() => {
    team.cancelManagement();
  }, [team]);

  const handleLeaderChange = useCallback(
    (leaderId: string) => {
      team.setLeaderDraftId(leaderId);
    },
    [team],
  );

  const handleUpdateLeader = useCallback(() => {
    void team.submitLeaderUpdate();
  }, [team]);

  const handleRemoveStudent = useCallback(
    (
      studentId: string,
      firstName: string | null,
      lastName: string | null,
    ) => {
      const fullName =
        `${firstName ?? ""} ${lastName ?? ""}`.trim();

      const message = `Remove ${
        fullName || "this student"
      } from the project? They will lose access to the project workspace.`;

      if (window.confirm(message)) {
        void team.removeStudent(studentId);
      }
    },
    [team],
  );

  return (
    <div className="space-y-6">
      {/* =====================================================
          PROJECT MEMBERS
          ===================================================== */}

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Project Members
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Manage students assigned to this project
            </p>
          </div>

          {isSupervisor &&
            !team.isManagingStudents && (
              <button
                type="button"
                onClick={team.startManagement}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                + Add Students
              </button>
            )}
        </div>

        {/* =================================================
            ADD STUDENTS
            ================================================= */}

        {team.isManagingStudents && (
          <div className="mb-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Add students
              </h4>

              <p className="mt-1 text-sm text-slate-500">
                Search registered students by email and
                add them to this project.
              </p>
            </div>

            {/* Search input */}

            <div className="mt-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-900">
                  Search student email
                </span>

                <input
                  type="text"
                  value={team.studentQuery}
                  onChange={(event) =>
                    handleStudentSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Type at least 3 characters from the student email"
                  disabled={team.isAddingStudents}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-blue-400 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </label>
            </div>

            {/* Search results */}

            {(team.studentQuery.trim().length >= 3 ||
              team.studentSearchState === "loading" ||
              team.studentSearchState === "error") && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
                <BlockingState
                  isActive={
                    team.studentSearchState ===
                    "loading"
                  }
                  mode="inline"
                  message="Searching registered students..."
                  className="border-0 px-0 py-2"
                />

                {team.studentSearchState ===
                  "results" && (
                  <>
                    {visibleSearchResults.length >
                    0 ? (
                      <div className="space-y-2">
                        {visibleSearchResults.map(
                          (
                            student: SupervisorStudentSearchResult,
                          ) => (
                            <button
                              key={student.id}
                              type="button"
                              onClick={() =>
                                handleAddStudent(
                                  student,
                                )
                              }
                              disabled={
                                team.isAddingStudents
                              }
                              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <p className="font-medium text-slate-900">
                                {buildStudentLabel(
                                  student,
                                )}
                              </p>

                              <p className="mt-1 text-sm text-slate-500">
                                {student.email}
                              </p>

                              {student.registrationNumber && (
                                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                                  {
                                    student.registrationNumber
                                  }
                                </p>
                              )}
                            </button>
                          ),
                        )}
                      </div>
                    ) : (
                      <p className="px-1 py-2 text-sm text-slate-500">
                        No additional students found.
                      </p>
                    )}
                  </>
                )}

                {team.studentSearchState ===
                  "empty" && (
                  <p className="px-1 py-2 text-sm text-slate-500">
                    No registered student found.
                  </p>
                )}

                {team.studentSearchState ===
                  "error" && (
                  <p className="px-1 py-2 text-sm text-rose-600">
                    {team.studentSearchError?.message ??
                      "Unable to search students right now."}
                  </p>
                )}
              </div>
            )}

            {/* Selected students */}

            <div className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-slate-900">
                  Selected students
                </h4>

                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {team.selectedStudentsToAdd.length}{" "}
                  selected
                </span>
              </div>

              {team.selectedStudentsToAdd.length >
              0 ? (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-2">
                    {team.selectedStudentsToAdd.map(
                      (
                        student: SupervisorStudentSearchResult,
                      ) => (
                        <div
                          key={student.id}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm"
                        >
                          <span className="font-medium text-slate-900">
                            {buildStudentLabel(
                              student,
                            )}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveSelected(
                                student.id,
                              )
                            }
                            disabled={
                              team.isAddingStudents
                            }
                            className="text-slate-400 transition-colors hover:text-red-600 disabled:opacity-50"
                            aria-label={`Remove ${buildStudentLabel(
                              student,
                            )}`}
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  No students selected yet.
                </p>
              )}
            </div>

            {/* Buttons */}

            <div className="mt-5 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleCancelManagement}
                disabled={team.isAddingStudents}
              >
                Cancel
              </Button>

              <Button
                type="button"
                size="md"
                onClick={handleAddStudents}
                disabled={
                  team.isAddingStudents ||
                  team.selectedStudentsToAdd.length ===
                    0
                }
              >
                {team.isAddingStudents
                  ? "Adding..."
                  : "Add Students"}
              </Button>
            </div>
          </div>
        )}

        {/* =================================================
            MEMBERS LIST
            ================================================= */}

        <div className="space-y-3">
          {team.studentMembers.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <p>No students assigned yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {team.studentMembers.map(
                (member) => (
                  <div
                    key={member.id}
                    className="rounded-lg border border-slate-200 p-4 transition-colors hover:border-slate-300"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900">
                          {member.firstName ?? ""}{" "}
                          {member.lastName ?? ""}
                        </p>

                        <p className="break-all text-sm text-slate-500">
                          {member.email}
                        </p>

                        {member.registrationNumber && (
                          <p className="mt-1 text-xs text-slate-400">
                            {
                              member.registrationNumber
                            }
                          </p>
                        )}
                      </div>

                      {isSupervisor && (
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveStudent(
                              member.id,
                              member.firstName,
                              member.lastName,
                            )
                          }
                          disabled={
                            team.isAddingStudents
                          }
                          className="ml-2 rounded p-1 text-red-600 transition-colors hover:bg-red-50 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Remove from project"
                          aria-label={`Remove ${
                            member.firstName ?? ""
                          } ${
                            member.lastName ?? ""
                          } from project`}
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>

                    {member.id ===
                      project.leader?.id && (
                      <div className="inline-block rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                        Project Leader
                      </div>
                    )}
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          PROJECT LEADER
          ===================================================== */}

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Project Leader
        </h3>

        <p className="mb-4 text-sm text-slate-500">
          Select one of the assigned students as the
          project leader.
        </p>

        {team.studentMembers.length === 0 ? (
          <p className="text-sm text-slate-500">
            Add students to the project before selecting
            a project leader.
          </p>
        ) : (
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-900">
                Project leader
              </span>

              <Select
                value={team.leaderDraftId}
                onChange={(event) =>
                  handleLeaderChange(
                    event.target.value,
                  )
                }
                disabled={team.isUpdatingLeader}
                className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition-colors focus:border-blue-400 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">
                  Select a project leader
                </option>

                {team.studentMembers.map(
                  (student) => (
                    <option
                      key={student.id}
                      value={student.id}
                    >
                      {`${student.firstName ?? ""} ${
                        student.lastName ?? ""
                      }`.trim() ||
                        student.email}
                      {student.registrationNumber
                        ? ` (${student.registrationNumber})`
                        : ""}
                    </option>
                  ),
                )}
              </Select>
            </label>

            {project.leader && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-blue-600">
                  Current project leader
                </p>

                <p className="mt-1 font-medium text-blue-900">
                  {`${project.leader.firstName ?? ""} ${
                    project.leader.lastName ?? ""
                  }`.trim() ||
                    project.leader.email}
                </p>

                <p className="mt-1 text-sm text-blue-700">
                  {project.leader.email}
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="button"
                size="md"
                onClick={handleUpdateLeader}
                disabled={
                  team.isUpdatingLeader ||
                  !team.leaderDraftId ||
                  team.leaderDraftId ===
                    project.leader?.id
                }
              >
                {team.isUpdatingLeader
                  ? "Updating..."
                  : "Update Leader"}
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}