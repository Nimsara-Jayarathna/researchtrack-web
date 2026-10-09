import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RequirementEditorModal } from "./RequirementEditorModal";

const { api } = vi.hoisted(() => ({
  api: {
    createRequirement: vi.fn(),
    updateRequirement: vi.fn(),
  },
}));

vi.mock("../api/submissionApi", () => ({ submissionApi: api }));

describe("RequirementEditorModal submission responsibility", () => {
  it("blocks Project Leader responsibility when no leader exists and routes to member management", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onManageMembers = vi.fn();

    render(
      <RequirementEditorModal
        isOpen
        projectId="project-1"
        requirement={null}
        projectLeader={null}
        studentMembers={[]}
        onManageMembers={onManageMembers}
        onClose={onClose}
        onSaved={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/No Project Leader has been assigned to this project/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create requirement" }),
    ).toBeDisabled();

    await user.click(
      screen.getByRole("button", { name: /Go to member management/i }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onManageMembers).toHaveBeenCalledTimes(1);
  });

  it("allows delegation to one active project student when no leader exists", async () => {
    const user = userEvent.setup();

    render(
      <RequirementEditorModal
        isOpen
        projectId="project-1"
        requirement={null}
        projectLeader={null}
        studentMembers={[
          {
            id: "student-2",
            firstName: "Amal",
            lastName: "Perera",
            email: "amal@example.com",
          },
        ]}
        onManageMembers={vi.fn()}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("radio", { name: /Specific student/i }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: /Responsible student/i }),
      "student-2",
    );

    expect(screen.getByRole("button", { name: "Create requirement" })).toBeDisabled();
    await user.type(screen.getByRole("textbox", { name: /Title/i }), "Progress report");
    expect(screen.getByRole("button", { name: "Create requirement" })).toBeEnabled();
  });
});
