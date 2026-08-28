import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createEmptyProjectGitHubPreview } from "@/features/projects/api/projectResource";
import type { TeamState } from "../../hooks/useProjectDetailsPageState";
import type { SupervisorProjectDetail } from "../../types";
import { TeamTabSection } from "./TeamTabSection";

const student = {
  id: "student-2",
  firstName: "Bob",
  lastName: "Student",
  email: "bob@students.example.edu",
  registrationNumber: "ST00000002",
  memberRole: "STUDENT" as const,
};

const supervisor = {
  id: "supervisor-1",
  firstName: "Dr",
  lastName: "Supervisor",
  email: "supervisor@staff.example.edu",
  registrationNumber: null,
  memberRole: "SUPERVISOR" as const,
};

const project: SupervisorProjectDetail = {
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
  members: [supervisor, student],
  milestones: [],
  milestoneInsights: null,
  files: null,
};

function teamState(overrides: Partial<TeamState> = {}): TeamState {
  return {
    isManagingStudents: true,
    studentQuery: "",
    studentSearchState: "idle",
    studentSearchError: null,
    studentSearchResults: [],
    selectedStudentsToAdd: [],
    isAddingStudents: false,
    studentPendingRemoval: null,
    isRemovingStudent: false,
    leaderDraftId: "",
    isUpdatingLeader: false,
    studentMembers: [student],
    setStudentQuery: vi.fn(),
    setLeaderDraftId: vi.fn(),
    startManagement: vi.fn(),
    cancelManagement: vi.fn(),
    selectStudentToAdd: vi.fn(),
    removeSelectedStudent: vi.fn(),
    addStudents: vi.fn(),
    requestStudentRemoval: vi.fn(),
    cancelStudentRemoval: vi.fn(),
    confirmStudentRemoval: vi.fn().mockResolvedValue(undefined),
    submitLeaderUpdate: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("TeamTabSection US-105 membership UI", () => {
  it("keeps membership actions in the existing Manage Students modal", async () => {
    const requestStudentRemoval = vi.fn();
    const team = teamState({ requestStudentRemoval });
    const user = userEvent.setup();

    render(<TeamTabSection project={project} team={team} />);

    expect(screen.getByText("Manage Students")).toBeInTheDocument();
    expect(screen.getByText("Current students (1)")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove Bob Student" }));
    expect(requestStudentRemoval).toHaveBeenCalledWith(student);
  });

  it("uses the shared confirmation dialog before removal", async () => {
    const confirmStudentRemoval = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <TeamTabSection
        project={project}
        team={teamState({ studentPendingRemoval: student, confirmStudentRemoval })}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Remove student?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(confirmStudentRemoval).toHaveBeenCalledTimes(1);
  });
});
