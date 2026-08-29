import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StudentProjectTeamTab } from "./StudentProjectTeamTab";

describe("StudentProjectTeamTab Sprint 1 hierarchy", () => {
  it("renders the Supervisor before Students regardless of API member order", () => {
    render(
      <StudentProjectTeamTab
        members={[
          {
            id: "student-1",
            firstName: "Alice",
            lastName: "Student",
            email: "alice@example.test",
            registrationNumber: "ST001",
            memberRole: "STUDENT",
          },
          {
            id: "supervisor-1",
            firstName: "Dr",
            lastName: "Supervisor",
            email: "supervisor@example.test",
            registrationNumber: null,
            memberRole: "SUPERVISOR",
          },
        ]}
      />,
    );

    const memberCards = document.querySelectorAll("[data-member-role]");
    expect(memberCards[0]).toHaveAttribute("data-member-role", "SUPERVISOR");
    expect(memberCards[1]).toHaveAttribute("data-member-role", "STUDENT");
  });

  it("does not repeat a leader badge inside generic member cards", () => {
    render(
      <StudentProjectTeamTab
        members={[
          {
            id: "student-1",
            firstName: "Alice",
            lastName: "Student",
            email: "alice@example.test",
            registrationNumber: "ST001",
            memberRole: "STUDENT",
          },
        ]}
      />,
    );

    expect(screen.queryByText(/^Leader$/i)).not.toBeInTheDocument();
  });
});
