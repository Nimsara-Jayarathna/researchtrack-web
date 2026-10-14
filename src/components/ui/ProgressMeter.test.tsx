import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProgressMeter } from "./ProgressMeter";

describe("ProgressMeter", () => {
  it("communicates reported progress without conflating it with project lifecycle", () => {
    render(<ProgressMeter value={100} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "Reported progress" }),
    ).toHaveAttribute("aria-valuenow", "100");
  });

  it("treats missing progress as unknown rather than zero", () => {
    render(<ProgressMeter value={null} />);
    expect(screen.getByText("Not reported")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).not.toHaveAttribute(
      "aria-valuenow",
    );
  });

  it("clamps visual width for invalid out-of-range percentage values", () => {
    const { container } = render(<ProgressMeter value={125} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
    expect(
      container.querySelector('[style*="width: 100%"]'),
    ).toBeInTheDocument();
  });
});
