import { render, screen } from "@testing-library/react";
import { BrandConstellation } from "./BrandConstellation";
import { ProductPreview } from "./ProductPreview";
import { ProjectJourneyPreview } from "./ProjectJourneyPreview";
import { WorkflowAppSnapshot } from "./WorkflowAppSnapshot";

describe("application-based landing visuals", () => {
  it("reuses the actual product logo and describes its connections", () => {
    render(<BrandConstellation />);
    expect(screen.getByRole("img", { name: "ResearchTrack" })).toHaveAttribute("src", "/logo.png");
    expect(screen.getByText("GitHub activity")).toBeInTheDocument();
    expect(screen.getByText("Jira insights")).toBeInTheDocument();
    expect(screen.getByText("Submission reviews")).toBeInTheDocument();
  });

  it("reflects the seven supervisor dashboard metrics, project health and risks", () => {
    render(<ProductPreview />);
    expect(screen.getByText("Supervisor Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Total projects")).toBeInTheDocument();
    expect(screen.getByText("Jira at risk")).toBeInTheDocument();
    expect(screen.getByText("Jira behind")).toBeInTheDocument();
    expect(screen.getByText("Project health")).toBeInTheDocument();
    expect(screen.getByText("Projects needing attention")).toBeInTheDocument();
    expect(screen.getAllByText("Upcoming milestones")).toBeInTheDocument();
    expect(screen.getByText(/Fictional sample data/i)).toBeInTheDocument();
  });

  it("mirrors the project detail tabs without pretending sample tabs are clickable", () => {
    const { container } = render(<ProjectJourneyPreview />);
    expect(screen.getByText("Project Horizon")).toBeInTheDocument();
    expect(screen.getAllByText("Milestones")).toBeInTheDocument();
    expect(screen.getAllByText("GitHub")).toBeInTheDocument();
    expect(screen.getAllByText("Jira")).toBeInTheDocument();
    expect(screen.getByText("Research submissions")).toBeInTheDocument();
    expect(container.querySelectorAll('button, a[href]')).toHaveLength(0);
  });

  it.each([
    ["plan", "Create research project"],
    ["connect", "Connected project activity"],
    ["collaborate", "Meeting records"],
    ["review", "Research Submissions"],
  ] as const)("renders a supported %s application workflow", (stage, heading) => {
    render(<WorkflowAppSnapshot stage={stage} />);
    expect(screen.getByText(heading)).toBeInTheDocument();
    expect(screen.getByText(/Fictional sample data/i)).toBeInTheDocument();
  });
});
