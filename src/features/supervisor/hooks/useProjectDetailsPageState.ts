import { useEffect, useState } from "react";
import { supervisorApi } from "../api/supervisorApi";
import type { SupervisorProjectDetail } from "../types";
import { useRequestModalControls } from "./projectDetails/useRequestModalControls";
import {
  useProjectTeamState,
  type TeamState,
} from "./projectDetails/useProjectTeamState";
import {
  useProjectLifecycleState,
  type ProjectLifecycleState,
} from "./projectDetails/useProjectLifecycleState";
import {
  useProjectMilestonesState,
  type MilestonesState,
} from "./projectDetails/useProjectMilestonesState";
import {
  useProjectOverviewState,
  type OverviewState,
} from "./projectDetails/useProjectOverviewState";

type UseProjectDetailsPageStateParams = {
  projectId: string | undefined;
  loadedProject: SupervisorProjectDetail | null;
};

export type { OverviewState } from "./projectDetails/useProjectOverviewState";
export type { MilestonesState } from "./projectDetails/useProjectMilestonesState";
export type { TeamState } from "./projectDetails/useProjectTeamState";

export type ProjectDetailsActions = {
  quickLifecycleStatus: ProjectLifecycleState["quickLifecycleStatus"];
  isUpdatingStatus: ProjectLifecycleState["isUpdatingStatus"];
  handleQuickStatusChange: ProjectLifecycleState["handleQuickStatusChange"];
  handleProjectUpdate: (
    updatedProject: SupervisorProjectDetail,
  ) => void;
};

export function useProjectDetailsPageState({
  projectId,
  loadedProject,
}: UseProjectDetailsPageStateParams) {
  const [project, setProject] =
    useState<SupervisorProjectDetail | null>(null);

  const requestModalControls =
    useRequestModalControls();

  useEffect(() => {
    setProject(loadedProject);
  }, [loadedProject]);

  function handleProjectUpdate(
    updatedProject: SupervisorProjectDetail,
  ) {
    setProject(updatedProject);
  }

  const showLoadingModal =
    requestModalControls.showLoading;

  const showSuccessModal =
    requestModalControls.showSuccess;

  const showErrorModal =
    requestModalControls.showError;

  const showValidationModal =
    requestModalControls.showValidationError;

  /*
   * =========================================================
   * PROJECT TEAM
   * =========================================================
   */
  const team: TeamState = useProjectTeamState({
    projectId,
    project,
    setProject,
    showLoadingModal,
    showSuccessModal,
    showErrorModal,

    api: {
      searchStudents:
        supervisorApi.searchStudents,

      addProjectMembers:
        supervisorApi.addProjectMembers,

      removeProjectMember:
        supervisorApi.removeProjectMember,

      updateProject:
        supervisorApi.updateProject,
    },
  });

  /*
   * =========================================================
   * PROJECT OVERVIEW
   * =========================================================
   */
  const overview: OverviewState =
    useProjectOverviewState({
      projectId,
      project,
      setProject,
      showLoadingModal,
      showSuccessModal,
      showErrorModal,

      api: {
        updateProject:
          supervisorApi.updateProject,
      },
    });

  /*
   * =========================================================
   * PROJECT LIFECYCLE
   * =========================================================
   */
  const lifecycle: ProjectLifecycleState =
    useProjectLifecycleState({
      projectId,
      project,
      setProject,
      showLoadingModal,
      showSuccessModal,
      showErrorModal,

      api: {
        updateProjectStatus:
          supervisorApi.updateProjectStatus,
      },
    });

  /*
   * =========================================================
   * PROJECT MILESTONES
   * =========================================================
   */
  const milestones: MilestonesState =
    useProjectMilestonesState({
      projectId,
      project,
      setProject,
      showLoadingModal,
      showSuccessModal,
      showErrorModal,
      showValidationModal,

      api: {
        addProjectMilestone:
          supervisorApi.addProjectMilestone,

        updateProjectMilestone:
          supervisorApi.updateProjectMilestone,
      },
    });

  /*
   * =========================================================
   * PROJECT DETAILS ACTIONS
   * =========================================================
   */
  const actions: ProjectDetailsActions = {
    quickLifecycleStatus:
      lifecycle.quickLifecycleStatus,

    isUpdatingStatus:
      lifecycle.isUpdatingStatus,

    handleQuickStatusChange:
      lifecycle.handleQuickStatusChange,

    handleProjectUpdate,
  };

  return {
    project,
    overview,
    team,
    milestones,
    requestModal: requestModalControls,
    actions,
  };
}