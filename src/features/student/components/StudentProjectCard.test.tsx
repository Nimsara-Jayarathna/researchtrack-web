import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { StudentProjectCard } from "./StudentProjectCard";

const project = {
  id: "project-1",
  title: "A very long research project title that should remain constrained",
  summary:
    "A long research summary that stays within the compact card hierarchy.",
  status: "PLANNING" as const,
  batch: "2026",
  semester: "Semester 1",
  milestoneDate: "2026-09-01",
  lastActivityAt: "2026-08-28T00:00:00Z",
  progressPercent: 0,
  supervisorName: "Dr Nimsara Jayarathna With A Long Display Name",
};

describe("StudentProjectCard Sprint 1 presentation", () => {
  it("shows batch once and uses the second metadata position for semester", () => {
    render(
      <MemoryRouter>
        <StudentProjectCard project={project} />
      </MemoryRouter>,
    );

    expect(screen.getAllByText("2026")).toHaveLength(1);
    expect(screen.getByText("Semester 1")).toBeInTheDocument();
  });

  it("keeps full long values available while the visible fields use truncation constraints", () => {
    render(
      <MemoryRouter>
        <StudentProjectCard project={project} />
      </MemoryRouter>,
    );

    expect(screen.getByTitle(project.title)).toHaveClass("truncate");
    expect(screen.getByTitle(project.supervisorName)).toHaveClass("truncate");
    expect(screen.getByTitle(project.summary)).toHaveStyle(
      "-webkit-line-clamp: 2",
    );
  });
});
