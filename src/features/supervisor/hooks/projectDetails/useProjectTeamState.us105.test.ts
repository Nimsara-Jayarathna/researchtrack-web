import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createEmptyProjectGitHubPreview } from "@/features/projects/api/projectResource";
import type { SupervisorProjectDetail } from "../../types";
import { useProjectTeamState } from "./useProjectTeamState";

const student = {
  id: "student-2",
  firstName: "Bob",
  lastName: "Student",
  email: "bob@students.example.edu",
  registrationNumber: "ST00000002",
  memberRole: "STUDENT" as const,
};

function projectWithMembers(
  members: SupervisorProjectDetail["members"],
): SupervisorProjectDetail {
  return {
    id: "project-1",
    title: "AI Research",
    summary: "Summary",
    lifecycleStatus: "ACTIVE",
    batch: "2026",
    semester: "Semester 1",
    milestoneDate: null,
    progressPercent: 0,
    lastActivityAt: null,
    repositoryUrl: null,
    github: createEmptyProjectGitHubPreview(),
    githubRepositories: null,
    jira: null,
    leader: null,
    members,
    milestones: [],
    milestoneInsights: null,
    files: null,
  };
}

describe("useProjectTeamState US-105", () => {
  it("confirms removal through the membership API and replaces project state", async () => {
    const currentProject = projectWithMembers([student]);
    const updatedProject = projectWithMembers([]);
    const setProject = vi.fn();
    const removeProjectMember = vi.fn().mockResolvedValue(updatedProject);

    const { result } = renderHook(() =>
      useProjectTeamState({
        projectId: "project-1",
        project: currentProject,
        setProject,
        showLoadingModal: vi.fn(),
        showSuccessModal: vi.fn(),
        showErrorModal: vi.fn(),
        api: {
          searchStudents: vi.fn().mockResolvedValue([]),
          addProjectMembers: vi.fn(),
          removeProjectMember,
          updateProjectLeader: vi.fn(),
        },
      }),
    );

    act(() => result.current.requestStudentRemoval(student));
    expect(result.current.studentPendingRemoval?.id).toBe("student-2");

    await act(async () => {
      await result.current.confirmStudentRemoval();
    });

    expect(removeProjectMember).toHaveBeenCalledWith("project-1", "student-2");
    expect(setProject).toHaveBeenCalledWith(updatedProject);
    expect(result.current.studentPendingRemoval).toBeNull();
  });

  it("updates the leader through the dedicated leader API without resending project metadata", async () => {
    const studentA = {
      ...student,
      id: "student-1",
      firstName: "Alice",
      email: "alice@students.example.edu",
      registrationNumber: "ST00000001",
    };
    const currentProject = {
      ...projectWithMembers([studentA, student]),
      leader: {
        id: "student-1",
        firstName: "Alice",
        lastName: "Student",
        email: "alice@students.example.edu",
        registrationNumber: "ST00000001",
      },
    };
    const updatedProject = {
      ...currentProject,
      leader: {
        id: "student-2",
        firstName: "Bob",
        lastName: "Student",
        email: "bob@students.example.edu",
        registrationNumber: "ST00000002",
      },
    };
    const setProject = vi.fn();
    const updateProjectLeader = vi.fn().mockResolvedValue(updatedProject);

    const { result } = renderHook(() =>
      useProjectTeamState({
        projectId: "project-1",
        project: currentProject,
        setProject,
        showLoadingModal: vi.fn(),
        showSuccessModal: vi.fn(),
        showErrorModal: vi.fn(),
        api: {
          searchStudents: vi.fn().mockResolvedValue([]),
          addProjectMembers: vi.fn(),
          removeProjectMember: vi.fn(),
          updateProjectLeader,
        },
      }),
    );

    act(() => result.current.setLeaderDraftId("student-2"));

    await act(async () => {
      await result.current.submitLeaderUpdate();
    });

    expect(updateProjectLeader).toHaveBeenCalledWith("project-1", {
      leaderStudentId: "student-2",
    });
    expect(setProject).toHaveBeenCalledWith(updatedProject);
  });
});
