import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProjectHeroCard } from "./ProjectHeroCard";
import { SupervisorProjectDetailsKpis } from "@/features/supervisor/components/projectDetails/SupervisorProjectDetailsKpis";
import { StudentProjectDetailsKpis } from "@/features/student/components/projectDetails/StudentProjectDetailsKpis";

describe("Compact project summary", () => {
  it("does not repeat a summary identical to the project name", () => {
    render(
      <ProjectHeroCard
        title="Research 1"
        subtitle="Research 1"
        rightSlot={<span>Planning</span>}
        kpiSlot={<span>Metrics</span>}
      />,
    );
    expect(screen.getAllByText("Research 1")).toHaveLength(1);
  });

  it.each([
    ["supervisor", SupervisorProjectDetailsKpis],
    ["student", StudentProjectDetailsKpis],
  ] as const)(
    "shows progress only once in the %s KPI grid",
    (_role, Metrics) => {
      render(
        <Metrics
          batch="2027"
          semester="Semester 2"
          milestonesCount={4}
          progressPercent={25}
        />,
      );
      expect(screen.getAllByText("25%")).toHaveLength(1);
      expect(
        screen.getByRole("progressbar", { name: "Reported progress" }),
      ).toHaveAttribute("aria-valuenow", "25");
      expect(screen.getByText("Semester 2")).toBeInTheDocument();
    },
  );
});
