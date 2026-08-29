import { useEffect, useState } from "react";
import { toApiError } from "../../projectDetails.shared";
import type {
  SupervisorProjectDetail,
  SupervisorProjectLifecycle,
  UpdateSupervisorProjectRequest,
} from "../../types";

export type ProjectLifecycleState = {
  quickLifecycleStatus: SupervisorProjectLifecycle;
  isUpdatingStatus: boolean;
  handleQuickStatusChange: (nextStatus: SupervisorProjectLifecycle) => void;
};

type UseProjectLifecycleStateParams = {
  projectId: string | undefined;
  project: SupervisorProjectDetail | null;
  setProject: (next: SupervisorProjectDetail) => void;
  showLoadingModal: (title: string, message: string) => void;
  showSuccessModal: (title: string, message: string) => void;
  showErrorModal: (
    title: string,
    message: string,
    retryAction: () => Promise<void>,
  ) => void;
  api: {
    updateProject: (
      projectId: string,
      payload: UpdateSupervisorProjectRequest,
    ) => Promise<SupervisorProjectDetail>;
  };
};

function buildLifecycleUpdateRequest(
  project: SupervisorProjectDetail,
  lifecycleStatus: SupervisorProjectLifecycle,
): UpdateSupervisorProjectRequest {
  return {
    title: project.title,
    summary: project.summary,
    batch: project.batch ?? "",
    semester: project.semester ?? "",
    lifecycleStatus,
  };
}

function lifecycleLabel(status: SupervisorProjectLifecycle): string {
  return status.replace(/_/g, " ");
}

export function useProjectLifecycleState({
  projectId,
  project,
  setProject,
  showLoadingModal,
  showSuccessModal,
  showErrorModal,
  api,
}: UseProjectLifecycleStateParams): ProjectLifecycleState {
  const [quickLifecycleStatus, setQuickLifecycleStatus] =
    useState<SupervisorProjectLifecycle>("PLANNING");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (project && !isUpdatingStatus) {
      setQuickLifecycleStatus(project.lifecycleStatus);
    }
  }, [project, isUpdatingStatus]);

  async function submitQuickStatusChange(
    nextStatus: SupervisorProjectLifecycle,
    previousStatus: SupervisorProjectLifecycle,
  ) {
    if (!projectId || !project) return;

    setQuickLifecycleStatus(nextStatus);
    setIsUpdatingStatus(true);
    showLoadingModal(
      "Updating project status",
      `Switching lifecycle status to ${lifecycleLabel(nextStatus)}.`,
    );

    try {
      const updatedProject = await api.updateProject(
        projectId,
        buildLifecycleUpdateRequest(project, nextStatus),
      );
      setProject(updatedProject);
      showSuccessModal(
        "Project status updated",
        `Lifecycle status is now ${lifecycleLabel(nextStatus)}.`,
      );
    } catch (statusException) {
      setQuickLifecycleStatus(previousStatus);
      const apiError = toApiError(
        statusException,
        "Unable to update project status right now.",
      );
      showErrorModal(
        "Unable to update project status",
        apiError.message,
        async () => submitQuickStatusChange(nextStatus, previousStatus),
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  function handleQuickStatusChange(nextStatus: SupervisorProjectLifecycle) {
    if (
      !project ||
      isUpdatingStatus ||
      nextStatus === project.lifecycleStatus
    ) {
      return;
    }

    void submitQuickStatusChange(nextStatus, project.lifecycleStatus);
  }

  return { quickLifecycleStatus, isUpdatingStatus, handleQuickStatusChange };
}
