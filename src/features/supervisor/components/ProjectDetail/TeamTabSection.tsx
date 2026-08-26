import { useCallback, useMemo } from "react";
import { X } from "lucide-react";
import { StudentSearchDialog } from "../StudentSearchDialog";
import { ProjectLeaderSelect } from "../ProjectLeaderSelect";
import type { TeamState } from "../../hooks/projectDetails/useProjectTeamState";
import type { SupervisorProjectDetail } from "../../types";
import { FIELD_LIMITS } from "../../projectDetails.shared";

type TeamTabSectionProps = {
  project: SupervisorProjectDetail;
  team: TeamState;
};

export function TeamTabSection({ project, team }: TeamTabSectionProps) {
  const isSupervisor = true; // Assuming supervisor is viewing

  const excludedStudentIds = useMemo(
    () =>
      new Set([
        ...team.studentMembers.map((member) => member.id),
        ...team.selectedStudentsToAdd.map((student) => student.id),
      ]),
    [team.studentMembers, team.selectedStudentsToAdd],
  );

  const handleStudentSearch = useCallback(
    (query: string) => {
      team.setStudentQuery(query);
    },
    [team],
  );

  const handleAddStudent = useCallback(
    (student) => {
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
    (studentId: string, firstName: string, lastName: string) => {
      const fullName = `${firstName} ${lastName}`.trim();
      if (
        confirm(
          `Remove ${fullName} from the project? They will lose access to the project workspace.`,
        )
      ) {
        void team.removeStudent(studentId);
      }
    },
    [team],
  );

  return (
    <div className="space-y-6">
      {/* Project Members Section */}
      <section className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Project Members
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Manage students assigned to this project
            </p>
          </div>
          {isSupervisor && !team.isManagingStudents && (
            <button
              type="button"
              onClick={() => team.startManagement()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
            >
              + Add Students
            </button>
          )}
        </div>

        {/* Add Students Section */}
        {team.isManagingStudents && (
          <StudentSearchDialog
            query={team.studentQuery}
            onQueryChange={handleStudentSearch}
            searchState={team.studentSearchState}
            searchError={team.studentSearchError}
            searchResults={team.studentSearchResults}
            onSelectStudent={handleAddStudent}
            selectedStudents={team.selectedStudentsToAdd}
            onRemoveSelected={handleRemoveSelected}
            onAdd={handleAddStudents}
            onCancel={handleCancelManagement}
            isLoading={team.isAddingStudents}
          />
        )}

        {/* Members List */}
        <div className="space-y-3">
          {team.studentMembers.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <p>No students assigned yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {team.studentMembers.map((member) => (
                <div
                  key={member.id}
                  className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-sm text-slate-500">{member.email}</p>
                      {member.registrationNumber && (
                        <p className="text-xs text-slate-400 mt-1">
                          {member.registrationNumber}
                        </p>
                      )}
                    </div>
                    {isSupervisor && (
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveStudent(
                            member.id,
                            member.firstName || "",
                            member.lastName || "",
                          )
                        }
                        disabled={team.isAddingStudents}
                        className="ml-2 text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remove from project"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  {member.id === project.leader?.id && (
                    <div className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      Project Leader
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Project Leader Section */}
      <section className="bg-white rounded-lg border border-slate-200 p-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Project Leader
          </h3>
          <ProjectLeaderSelect
            projectId={project.id}
            currentLeader={project.leader}
            availableLeaders={team.studentMembers}
            leaderDraftId={team.leaderDraftId}
            onLeaderChange={handleLeaderChange}
            onSubmit={handleUpdateLeader}
            isLoading={team.isUpdatingLeader}
          />
        </div>
      </section>
    </div>
  );
}