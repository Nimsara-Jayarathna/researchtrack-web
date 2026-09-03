import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createEmptyProjectGitHubPreview } from "@/features/projects/api/projectResource";
import type { SupervisorProjectDetail } from "../../types";
import { useProjectLifecycleState } from "./useProjectLifecycleState";

function projectWithStatus(
  lifecycleStatus: SupervisorProjectDetail["lifecycleStatus"],
): SupervisorProjectDetail {
  return {
    id: "project-1",
    title: "AI Research",
    summary: "Research project summary",
    lifecycleStatus,
    batch: "2026",
    semester: "Semester 1",
    milestoneDate: null,
    progressPercent: 20,
    lastActivityAt: null,
    repositoryUrl: null,
    github: createEmptyProjectGitHubPreview(),
    githubRepositories: null,
    jira: null,
    leader: null,
    members: [],
    milestones: [],
    milestoneInsights: null,
    files: null,
  };
}

describe("useProjectLifecycleState", () => {
  it("updates lifecycle through the canonical project update API", async () => {
    const currentProject = projectWithStatus("PLANNING");
    const updatedProject = projectWithStatus("ACTIVE");
    const updateProject = vi.fn().mockResolvedValue(updatedProject);
    const setProject = vi.fn();
    const showSuccessModal = vi.fn();

    const { result } = renderHook(() =>
      useProjectLifecycleState({
        projectId: "project-1",
        project: currentProject,
        setProject,
        showLoadingModal: vi.fn(),
        showSuccessModal,
        showErrorModal: vi.fn(),
        api: { updateProject },
      }),
    );

    act(() => result.current.handleQuickStatusChange("ACTIVE"));

    await waitFor(() => {
      expect(updateProject).toHaveBeenCalledWith("project-1", {
        title: "AI Research",
        summary: "Research project summary",
        batch: "2026",
        semester: "Semester 1",
        lifecycleStatus: "ACTIVE",
      });
    });

    await waitFor(() =>
      expect(setProject).toHaveBeenCalledWith(updatedProject),
    );
    expect(showSuccessModal).toHaveBeenCalledWith(
      "Project status updated",
      "Lifecycle status is now ACTIVE.",
    );
  });

  it("rolls the quick control back when the backend update fails", async () => {
    const currentProject = projectWithStatus("PLANNING");
    const updateProject = vi
      .fn()
      .mockRejectedValue(new Error("Network failed"));
    const showErrorModal = vi.fn();

    const { result } = renderHook(() =>
      useProjectLifecycleState({
        projectId: "project-1",
        project: currentProject,
        setProject: vi.fn(),
        showLoadingModal: vi.fn(),
        showSuccessModal: vi.fn(),
        showErrorModal,
        api: { updateProject },
      }),
    );

    act(() => result.current.handleQuickStatusChange("AT_RISK"));

    await waitFor(() => expect(updateProject).toHaveBeenCalledTimes(1));
    await waitFor(() => {
      expect(result.current.quickLifecycleStatus).toBe("PLANNING");
      expect(result.current.isUpdatingStatus).toBe(false);
    });
    expect(showErrorModal).toHaveBeenCalledWith(
      "Unable to update project status",
      expect.any(String),
      expect.any(Function),
    );
  });

  it("does not send a redundant update for the current lifecycle status", () => {
    const updateProject = vi.fn();
    const currentProject = projectWithStatus("ACTIVE");

    const { result } = renderHook(() =>
      useProjectLifecycleState({
        projectId: "project-1",
        project: currentProject,
        setProject: vi.fn(),
        showLoadingModal: vi.fn(),
        showSuccessModal: vi.fn(),
        showErrorModal: vi.fn(),
        api: { updateProject },
      }),
    );

    act(() => result.current.handleQuickStatusChange("ACTIVE"));

    expect(updateProject).not.toHaveBeenCalled();
  });
});
