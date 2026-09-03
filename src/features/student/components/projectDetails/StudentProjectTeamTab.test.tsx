import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StudentProjectTeamTab } from "./StudentProjectTeamTab";

const supervisor = {
  id: "supervisor-1",
  firstName: "Dr",
  lastName: "Supervisor",
  email: "supervisor@example.test",
  registrationNumber: null,
  memberRole: "SUPERVISOR" as const,
};

const leader = {
  id: "student-2",
  firstName: "Leader",
  lastName: "Student",
  email: "leader@example.test",
  registrationNumber: "ST002",
};

const student = {
  id: "student-1",
  firstName: "Alice",
  lastName: "Student",
  email: "alice@example.test",
  registrationNumber: "ST001",
  memberRole: "STUDENT" as const,
};

const leaderMember = {
  ...leader,
  memberRole: "STUDENT" as const,
};

describe("StudentProjectTeamTab Sprint 1 hierarchy", () => {
  it("renders Supervisor first, project leader second, then remaining Students", () => {
    render(
      <StudentProjectTeamTab
        leader={leader}
        members={[student, leaderMember, supervisor]}
      />,
    );

    const memberCards = document.querySelectorAll("[data-member-role]");
    expect(memberCards[0]).toHaveAttribute("data-member-role", "SUPERVISOR");
    expect(memberCards[1]).toHaveAttribute("data-project-leader", "true");
    expect(memberCards[2]).toHaveAttribute("data-member-role", "STUDENT");
  });

  it("shows the authoritative leader in a compact Team-header summary", () => {
    render(
      <StudentProjectTeamTab
        leader={leader}
        members={[supervisor, leaderMember, student]}
      />,
    );

    const summary = document.querySelector("[data-project-leader-summary]");
    expect(summary).toHaveTextContent("Project leader");
    expect(summary).toHaveTextContent("Leader Student");
  });

  it("uses a subtle leader card marker without adding a second role badge", () => {
    render(
      <StudentProjectTeamTab
        leader={leader}
        members={[supervisor, leaderMember]}
      />,
    );

    const leaderCard = document.querySelector('[data-project-leader="true"]');
    expect(leaderCard).not.toBeNull();
    expect(screen.getAllByText("Student")).toHaveLength(1);
    expect(screen.getAllByLabelText("Project leader")).toHaveLength(1);
  });

  it("shows an explicit neutral state when no leader is assigned", () => {
    render(
      <StudentProjectTeamTab leader={null} members={[supervisor, student]} />,
    );

    expect(screen.getByText("Not assigned yet")).toBeInTheDocument();
    expect(
      document.querySelector('[data-project-leader="true"]'),
    ).not.toBeInTheDocument();
  });
});
