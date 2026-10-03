import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MeetingRecordFormModal } from "./MeetingRecordFormModal";
import type { MeetingRecord } from "../types";

const existingRecord: MeetingRecord = {
  id: "record-1",
  projectId: "project-1",
  meetingDate: "2026-10-03",
  durationMinutes: 45,
  discussionSummary: "Reviewed methodology",
  discussionDetails: null,
  channelId: null,
  addedBy: "supervisor-1",
  addedByName: "Ada Supervisor",
  addedByRole: "SUPERVISOR",
  status: "APPROVED",
  approvedBy: "supervisor-1",
  approvedByName: "Ada Supervisor",
  approvedAt: "2026-10-03T08:30:00Z",
  createdAt: "2026-10-03T08:30:00Z",
  updatedAt: null,
};

describe("MeetingRecordFormModal", () => {
  it("shows required markers for required record fields", () => {
    render(
      <MeetingRecordFormModal
        isOpen
        mode="add"
        initialRecord={null}
        channels={[]}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getAllByText("*")).toHaveLength(3);
    expect(screen.getByText("Channel (optional)")).toBeInTheDocument();
    expect(screen.getByText("Discussion details (optional)")).toBeInTheDocument();
  });

  it("keeps edit save disabled until a real normalized value changes", async () => {
    const user = userEvent.setup();

    render(
      <MeetingRecordFormModal
        isOpen
        mode="edit"
        initialRecord={existingRecord}
        channels={[]}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    const save = screen.getByRole("button", { name: "Save changes" });
    expect(save).toBeDisabled();

    const summary = screen.getByPlaceholderText("What was discussed?");
    await user.clear(summary);
    await user.type(summary, "Reviewed methodology and results");
    expect(save).toBeEnabled();

    await user.clear(summary);
    await user.type(summary, "  Reviewed methodology  ");
    expect(save).toBeDisabled();
  });

  it("normalizes optional empty fields when comparing and submitting", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <MeetingRecordFormModal
        isOpen
        mode="edit"
        initialRecord={existingRecord}
        channels={[]}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    const details = screen.getByPlaceholderText("Optional detailed notes...");
    await user.type(details, "Updated detail");
    const save = screen.getByRole("button", { name: "Save changes" });
    expect(save).toBeEnabled();
    await user.click(save);

    expect(onSubmit).toHaveBeenCalledWith({
      meetingDate: "2026-10-03",
      durationMinutes: 45,
      discussionSummary: "Reviewed methodology",
      discussionDetails: "Updated detail",
      channelId: null,
    });
  });
});
