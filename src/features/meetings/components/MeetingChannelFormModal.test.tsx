import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MeetingChannelFormModal } from "./MeetingChannelFormModal";
import type { MeetingChannel } from "../types";

const existingChannel: MeetingChannel = {
  id: "channel-1",
  projectId: "project-1",
  platform: "ZOOM",
  channelName: "Weekly supervision",
  linkOrIdentifier: "https://zoom.example.test/weekly",
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

describe("MeetingChannelFormModal", () => {
  it("supports Student proposal wording without changing Supervisor defaults", () => {
    render(
      <MeetingChannelFormModal
        isOpen
        mode="add"
        initialChannel={null}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        addTitle="Propose meeting channel"
        addSubmitLabel="Submit proposal"
      />,
    );

    expect(
      screen.getByRole("dialog", { name: "Propose meeting channel" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Submit proposal" }),
    ).toBeInTheDocument();
  });

  it("marks required add fields and disables submit until a valid http/https link is entered", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <MeetingChannelFormModal
        isOpen
        mode="add"
        initialChannel={null}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getAllByText("*")).toHaveLength(3);
    expect(screen.getByLabelText("Select platform")).toHaveAttribute(
      "aria-required",
      "true",
    );

    const submit = screen.getByRole("button", { name: "Add channel" });
    expect(submit).toBeDisabled();

    await user.type(
      screen.getByPlaceholderText("Weekly supervision call"),
      "Weekly sync",
    );
    await user.type(
      screen.getByPlaceholderText("https://meet.google.com/..."),
      "meet.google.com/abc",
    );
    expect(
      screen.getByText("Enter a valid link starting with http:// or https://"),
    ).toBeInTheDocument();
    expect(submit).toBeDisabled();

    await user.clear(
      screen.getByPlaceholderText("https://meet.google.com/..."),
    );
    await user.type(
      screen.getByPlaceholderText("https://meet.google.com/..."),
      "https://meet.google.com/abc-defg-hij",
    );
    expect(
      screen.queryByText(
        "Enter a valid link starting with http:// or https://",
      ),
    ).not.toBeInTheDocument();
    expect(submit).toBeEnabled();
  });

  it("submits trimmed create values including platform", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <MeetingChannelFormModal
        isOpen
        mode="add"
        initialChannel={null}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.type(
      screen.getByPlaceholderText("Weekly supervision call"),
      "  Weekly sync  ",
    );
    await user.type(
      screen.getByPlaceholderText("https://meet.google.com/..."),
      "  https://example.com  ",
    );

    await user.click(screen.getByRole("button", { name: "Add channel" }));

    expect(onSubmit).toHaveBeenCalledWith({
      platform: "GOOGLE_MEET",
      channelName: "Weekly sync",
      linkOrIdentifier: "https://example.com",
    });
  });

  it("locks platform and keeps save disabled until a normalized edit changes", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <MeetingChannelFormModal
        isOpen
        mode="edit"
        initialChannel={existingChannel}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    expect(
      screen.getByText("Platform is fixed after this channel is created."),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Select platform")).not.toBeInTheDocument();
    expect(
      screen.getByLabelText("Platform: ZOOM. Locked after creation."),
    ).toBeInTheDocument();

    const save = screen.getByRole("button", { name: "Save changes" });
    expect(save).toBeDisabled();

    const name = screen.getByPlaceholderText("Weekly supervision call");
    await user.clear(name);
    await user.type(name, "Weekly supervision updated");
    expect(save).toBeEnabled();

    await user.clear(name);
    await user.type(name, "  Weekly supervision  ");
    expect(save).toBeDisabled();
  });

  it("submits edit payload without platform", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <MeetingChannelFormModal
        isOpen
        mode="edit"
        initialChannel={existingChannel}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    const link = screen.getByPlaceholderText("https://meet.google.com/...");
    await user.clear(link);
    await user.type(link, "  https://zoom.example.test/updated  ");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(onSubmit).toHaveBeenCalledWith({
      channelName: "Weekly supervision",
      linkOrIdentifier: "https://zoom.example.test/updated",
    });
  });
});
