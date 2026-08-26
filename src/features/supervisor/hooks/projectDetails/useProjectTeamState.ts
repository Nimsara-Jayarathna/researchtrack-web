import { useEffect, useMemo, useState } from "react";
import type { ApiError } from "@/types";
import type {
  SupervisorProjectDetail,
  SupervisorStudentSearchResult,
} from "../../types";
import type { SearchState } from "../../projectDetails.shared";
import { toApiError } from "../../projectDetails.shared";

export type TeamState = {
  isManagingStudents: boolean;

  studentQuery: string;
  studentSearchState: SearchState;
  studentSearchError: ApiError | null;
  studentSearchResults: SupervisorStudentSearchResult[];

  selectedStudentsToAdd: SupervisorStudentSearchResult[];

  isAddingStudents: boolean;

  leaderDraftId: string;
  isUpdatingLeader: boolean;

  studentMembers: SupervisorProjectDetail["members"];

  setStudentQuery: (query: string) => void;
  setLeaderDraftId: (id: string) => void;

  startManagement: () => void;
  cancelManagement: () => void;

  selectStudentToAdd: (
    student: SupervisorStudentSearchResult,
  ) => void;

  removeSelectedStudent: (studentId: string) => void;

  addStudents: () => void;

  removeStudent: (studentId: string) => Promise<void>;

  submitLeaderUpdate: () => Promise<void>;
};

type UseProjectTeamStateDeps = {
  projectId: string | undefined;

  project: SupervisorProjectDetail | null;

  setProject: (
    project: SupervisorProjectDetail,
  ) => void;

  showLoadingModal: (
    title: string,
    message: string,
  ) => void;

  showSuccessModal: (
    title: string,
    message: string,
  ) => void;

  showErrorModal: (
    title: string,
    message: string,
    retryAction: () => Promise<void>,
  ) => void;

  api: {
    searchStudents: (
      query: string,
    ) => Promise<SupervisorStudentSearchResult[]>;

    addProjectMembers: (
      projectId: string,
      payload: {
        studentIds: string[];
      },
    ) => Promise<SupervisorProjectDetail>;

    removeProjectMember: (
      projectId: string,
      studentId: string,
    ) => Promise<SupervisorProjectDetail>;

    updateProject: (
      projectId: string,
      payload: {
        title: string;
        summary: string;
        batch: string;
        semester: string;
        lifecycleStatus: SupervisorProjectDetail["lifecycleStatus"];
        leaderStudentId: string | null;
      },
    ) => Promise<SupervisorProjectDetail>;
  };
};

export function useProjectTeamState({
  projectId,
  project,
  setProject,
  showLoadingModal,
  showSuccessModal,
  showErrorModal,
  api,
}: UseProjectTeamStateDeps): TeamState {
  const [isManagingStudents, setIsManagingStudents] =
    useState(false);

  const [studentQuery, setStudentQuery] =
    useState("");

  const [studentSearchState, setStudentSearchState] =
    useState<SearchState>("idle");

  const [studentSearchError, setStudentSearchError] =
    useState<ApiError | null>(null);

  const [studentSearchResults, setStudentSearchResults] =
    useState<SupervisorStudentSearchResult[]>([]);

  const [selectedStudentsToAdd, setSelectedStudentsToAdd] =
    useState<SupervisorStudentSearchResult[]>([]);

  const [isAddingStudents, setIsAddingStudents] =
    useState(false);

  const [leaderDraftId, setLeaderDraftId] =
    useState("");

  const [isUpdatingLeader, setIsUpdatingLeader] =
    useState(false);

  const projectMembers = useMemo(
    () => project?.members ?? [],
    [project?.members],
  );

  const studentMembers = useMemo(
    () =>
      projectMembers.filter(
        (member) => member.memberRole === "STUDENT",
      ),
    [projectMembers],
  );

  /*
   * Keep the leader dropdown synchronized
   * with the currently loaded project.
   */
  useEffect(() => {
    setLeaderDraftId(project?.leader?.id ?? "");
  }, [project?.leader?.id]);

  /*
   * Search students with debounce.
   */
  useEffect(() => {
    const normalizedQuery = studentQuery.trim();

    if (
      !project ||
      !isManagingStudents ||
      normalizedQuery.length < 3
    ) {
      setStudentSearchResults([]);
      setStudentSearchState("idle");
      setStudentSearchError(null);

      return;
    }

    let cancelled = false;

    setStudentSearchState("loading");
    setStudentSearchError(null);

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          const results =
            await api.searchStudents(normalizedQuery);

          if (cancelled) {
            return;
          }

          /*
           * Exclude:
           * 1. Students already in the project
           * 2. Students already selected for adding
           */
          const excludedIds = new Set([
            ...studentMembers.map(
              (member) => member.id,
            ),
            ...selectedStudentsToAdd.map(
              (student) => student.id,
            ),
          ]);

          const visibleResults = results.filter(
            (student) =>
              !excludedIds.has(student.id),
          );

          setStudentSearchResults(visibleResults);

          setStudentSearchState(
            visibleResults.length > 0
              ? "results"
              : "empty",
          );
        } catch (searchException) {
          if (cancelled) {
            return;
          }

          setStudentSearchResults([]);
          setStudentSearchState("error");

          setStudentSearchError(
            toApiError(
              searchException,
              "Unable to search students right now.",
            ),
          );
        }
      })();
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    api,
    isManagingStudents,
    project,
    selectedStudentsToAdd,
    studentMembers,
    studentQuery,
  ]);

  /*
   * Start student management.
   */
  function startManagement(): void {
    setIsManagingStudents(true);
  }

  /*
   * Cancel student management.
   */
  function cancelManagement(): void {
    setIsManagingStudents(false);
    setStudentQuery("");
    setStudentSearchResults([]);
    setStudentSearchState("idle");
    setStudentSearchError(null);
    setSelectedStudentsToAdd([]);
  }

  /*
   * Select a student from search results.
   */
  function selectStudentToAdd(
    student: SupervisorStudentSearchResult,
  ): void {
    setSelectedStudentsToAdd((current) => {
      if (
        current.some(
          (selected) => selected.id === student.id,
        )
      ) {
        return current;
      }

      return [...current, student];
    });

    setStudentQuery("");
    setStudentSearchResults([]);
    setStudentSearchState("idle");
    setStudentSearchError(null);
  }

  /*
   * Remove a student from temporary selection.
   */
  function removeSelectedStudent(
    studentId: string,
  ): void {
    setSelectedStudentsToAdd((current) =>
      current.filter(
        (student) => student.id !== studentId,
      ),
    );
  }

  /*
   * Add selected students to the project.
   */
  async function submitAddStudents(): Promise<void> {
    if (
      !projectId ||
      selectedStudentsToAdd.length === 0
    ) {
      return;
    }

    setIsAddingStudents(true);

    showLoadingModal(
      "Adding team members",
      "Assigning selected students to this project.",
    );

    try {
      const updatedProject =
        await api.addProjectMembers(projectId, {
          studentIds: selectedStudentsToAdd.map(
            (student) => student.id,
          ),
        });

      setProject(updatedProject);

      /*
       * Clear temporary selection.
       */
      setIsManagingStudents(false);
      setStudentQuery("");
      setStudentSearchResults([]);
      setStudentSearchState("idle");
      setStudentSearchError(null);
      setSelectedStudentsToAdd([]);

      showSuccessModal(
        "Team updated",
        "Selected students were added to the project.",
      );
    } catch (addException) {
      const apiError = toApiError(
        addException,
        "Unable to add students right now.",
      );

      showErrorModal(
        "Unable to add students",
        apiError.message,
        submitAddStudents,
      );
    } finally {
      setIsAddingStudents(false);
    }
  }

  /*
   * Public function used by TeamTabSection.
   */
  function addStudents(): void {
    void submitAddStudents();
  }

  /*
   * Remove a student from the project.
   */
  async function submitRemoveStudent(
    studentId: string,
  ): Promise<void> {
    if (!projectId || !project) {
      return;
    }

    setIsAddingStudents(true);

    showLoadingModal(
      "Removing team member",
      "Removing the student from this project.",
    );

    try {
      const updatedProject =
        await api.removeProjectMember(
          projectId,
          studentId,
        );

      setProject(updatedProject);

      /*
       * If the removed student was the leader,
       * clear the draft leader.
       */
      if (leaderDraftId === studentId) {
        setLeaderDraftId("");
      }

      showSuccessModal(
        "Team member removed",
        "The student was removed from the project.",
      );
    } catch (removeException) {
      const apiError = toApiError(
        removeException,
        "Unable to remove student right now.",
      );

      showErrorModal(
        "Unable to remove student",
        apiError.message,
        () =>
          submitRemoveStudent(studentId),
      );
    } finally {
      setIsAddingStudents(false);
    }
  }

  /*
   * Public remove function.
   */
  async function removeStudent(
    studentId: string,
  ): Promise<void> {
    await submitRemoveStudent(studentId);
  }

  /*
   * Update project leader.
   */
  async function submitLeaderUpdate(): Promise<void> {
    if (
      !projectId ||
      !project ||
      !leaderDraftId ||
      leaderDraftId === project.leader?.id
    ) {
      return;
    }

    /*
     * Only an existing student member
     * can become project leader.
     */
    const selectedLeaderExists =
      studentMembers.some(
        (member) =>
          member.id === leaderDraftId,
      );

    if (!selectedLeaderExists) {
      showErrorModal(
        "Invalid project leader",
        "Please select a student who is already a member of this project.",
        submitLeaderUpdate,
      );

      return;
    }

    setIsUpdatingLeader(true);

    showLoadingModal(
      "Updating project leader",
      "Assigning the selected student as project leader.",
    );

    try {
      const updatedProject =
        await api.updateProject(projectId, {
          title: project.title,
          summary: project.summary ?? "",
          batch: project.batch ?? "",
          semester: project.semester ?? "",
          lifecycleStatus:
            project.lifecycleStatus,
          leaderStudentId: leaderDraftId,
        });

      setProject(updatedProject);

      showSuccessModal(
        "Project leader updated",
        "The project leader was updated successfully.",
      );
    } catch (leaderException) {
      const apiError = toApiError(
        leaderException,
        "Unable to update project leader right now.",
      );

      showErrorModal(
        "Unable to update leader",
        apiError.message,
        submitLeaderUpdate,
      );
    } finally {
      setIsUpdatingLeader(false);
    }
  }

  return {
    isManagingStudents,

    studentQuery,
    studentSearchState,
    studentSearchError,
    studentSearchResults,

    selectedStudentsToAdd,

    isAddingStudents,

    leaderDraftId,
    isUpdatingLeader,

    studentMembers,

    setStudentQuery,
    setLeaderDraftId,

    startManagement,
    cancelManagement,

    selectStudentToAdd,
    removeSelectedStudent,

    addStudents,
    removeStudent,

    submitLeaderUpdate,
  };
}