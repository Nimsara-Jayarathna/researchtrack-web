import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ProjectsPageView } from "./ProjectsPageView";

const baseProps = {
  title: "Projects",
  subtitle: "Research workspaces",
  searchValue: "",
  onSearchChange: vi.fn(),
  searchPlaceholder: "Search projects",
  error: null,
  onRetry: vi.fn(),
  renderItem: (item: string) => <article>{item}</article>,
  renderSkeleton: (index: number) => (
    <article>Loading card {index + 1}</article>
  ),
  emptyState: { title: "No projects", description: "No projects to display" },
};

describe("ProjectsPageView responsive and refresh states", () => {
  it("shows one responsive skeleton row instead of a fixed four-card count", () => {
    render(
      <MemoryRouter>
        <ProjectsPageView {...baseProps} isLoading items={[] as string[]} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Loading projects");
    expect(
      screen.getByRole("region", { name: "Loading projects" }),
    ).toHaveAttribute("aria-busy", "true");
    expect(screen.getAllByText(/Loading card/)).toHaveLength(3);
    expect(
      screen.getByText("Loading card 2").parentElement?.className,
    ).toContain("xl:block");
    expect(
      screen.getByText("Loading card 3").parentElement?.className,
    ).toContain("2xl:block");
  });

  it("preserves already loaded project cards during a refresh", () => {
    render(
      <MemoryRouter>
        <ProjectsPageView {...baseProps} isLoading items={["Project C"]} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Project C")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Updating projects");
    expect(screen.queryByText(/Loading card/)).not.toBeInTheDocument();
  });

  it("shows the empty state only after loading completes", () => {
    render(
      <MemoryRouter>
        <ProjectsPageView {...baseProps} isLoading={false} items={[]} />
      </MemoryRouter>,
    );
    expect(screen.getByText("No projects")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
