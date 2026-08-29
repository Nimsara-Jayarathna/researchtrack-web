import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createEmptyProjectGitHubPreview } from "@/features/projects/api/projectResource";
import type { TeamState } from "../../hooks/useProjectDetailsPageState";
import type { SupervisorProjectDetail } from "../../types";
import { TeamTabSection } from "./TeamTabSection";

const studentA = {
  id: "student-1",
  firstName: "Alice",
  lastName: "Student",
  email: "alice@students.example.edu",
  registrationNumber: "ST00000001",
  memberRole: "STUDENT" as const,
};

const studentB = {
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
  leader: {
    id: studentA.id,
    firstName: studentA.firstName,
    lastName: studentA.lastName,
    email: studentA.email,
    registrationNumber: studentA.registrationNumber,
  },
  members: [studentA, supervisor, studentB],
  milestones: [],
  milestoneInsights: null,
  files: null,
};

const team: TeamState = {
  isManagingStudents: false,
  studentQuery: "",
  studentSearchState: "idle",
  studentSearchError: null,
  studentSearchResults: [],
  selectedStudentsToAdd: [],
  isAddingStudents: false,
  studentPendingRemoval: null,
  isRemovingStudent: false,
  leaderDraftId: studentA.id,
  isUpdatingLeader: false,
  studentMembers: [studentA, studentB],
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
};

describe("TeamTabSection Sprint 1 hierarchy", () => {
  it("renders the Supervisor first and keeps leader identity out of generic member-card badges", () => {
    render(<TeamTabSection project={project} team={team} />);

    const memberCards = document.querySelectorAll("[data-member-role]");
    expect(memberCards[0]).toHaveAttribute("data-member-role", "SUPERVISOR");
    expect(memberCards[1]).toHaveAttribute("data-member-role", "STUDENT");
    expect(screen.queryByText(/^Leader$/i)).not.toBeInTheDocument();
    expect(screen.getByText("Project leader")).toBeInTheDocument();
  });
});
