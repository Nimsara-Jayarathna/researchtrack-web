import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { SupervisorProjectCard } from "./SupervisorProjectCard";
import type { SupervisorProjectSummary } from "../types";

const project: SupervisorProjectSummary = {
  id: "proj-1",
  title: "Project Alpha",
  summary: "Research delivery",
  batch: "2026",
  semester: "Semester 2",
  memberCount: 3,
  milestoneDate: "2026-10-02",
  progressPercent: 25,
  lifecycleStatus: "ACTIVE",
};

describe("SupervisorProjectCard V4", () => {
  it("keeps the progress value once and uses readable dates", () => {
    render(
      <MemoryRouter>
        <SupervisorProjectCard project={project} />
      </MemoryRouter>,
    );
    expect(screen.getAllByText("25%")).toHaveLength(1);
    expect(
      screen.getByRole("progressbar", { name: "Reported progress" }),
    ).toHaveAttribute("aria-valuenow", "25");
    expect(screen.getByText("Oct 2, 2026")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open project Project Alpha" }),
    ).toHaveAttribute("href", "/supervisor/projects/proj-1");
  });

  it("does not mistake completion for being late based solely on an old milestone date", () => {
    render(
      <MemoryRouter>
        <SupervisorProjectCard
          project={{
            ...project,
            lifecycleStatus: "COMPLETED",
            milestoneDate: "2020-01-01",
          }}
        />
      </MemoryRouter>,
    );
    expect(screen.queryByText(/Milestone date passed/)).not.toBeInTheDocument();
  });
});
