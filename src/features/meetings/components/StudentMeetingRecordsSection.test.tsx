import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StudentMeetingRecordsSection } from "./StudentMeetingRecordsSection";

const openAdd = vi.fn();
const refresh = vi.fn();

vi.mock("../hooks/useStudentMeetingRecordsState", () => ({
  useStudentMeetingRecordsState: () => ({
    records: [],
    channels: [],
    isLoading: false,
    error: null,
    hasLoaded: true,
    isFormOpen: false,
    viewingRecord: null,
    requestModal: {
      isOpen: false,
      status: "loading",
      title: "",
      message: "",
      retryAction: null,
    },
    load: vi.fn(),
    refresh,
    openAdd,
    closeForm: vi.fn(),
    submitForm: vi.fn(),
    openView: vi.fn(),
    closeView: vi.fn(),
    closeRequestModal: vi.fn(),
  }),
}));

describe("StudentMeetingRecordsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("presents Student meeting records as history and submission for Supervisor approval", () => {
    render(<StudentMeetingRecordsSection projectId="p-1" />);

    expect(screen.getByText("Meeting History")).toBeInTheDocument();
    expect(
      screen.getByText(/submit meeting records for Supervisor approval/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Submit record" }));
    expect(openAdd).toHaveBeenCalledTimes(1);
  });
});
