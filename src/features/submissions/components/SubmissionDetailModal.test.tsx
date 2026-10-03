import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SubmissionDetailModal } from "./SubmissionDetailModal";
import type { ResearchSubmission } from "../types";

const { api } = vi.hoisted(() => ({
  api: {
    getSubmission: vi.fn(),
    listComments: vi.fn(),
    reviewSubmission: vi.fn(),
    addComment: vi.fn(),
    getDownloadUrl: vi.fn(),
  },
}));

vi.mock("../api/submissionApi", () => ({ submissionApi: api }));

const pending: ResearchSubmission = {
  id: "submission-1",
  projectId: "project-1",
  requirementId: "requirement-1",
  status: "PENDING_REVIEW",
  versionCount: 1,
  currentVersionId: "version-1",
  approvedVersionId: null,
  lastSubmittedAt: "2026-10-04T10:00:00Z",
  approvedAt: null,
  requirement: {
    id: "requirement-1",
    title: "Final Thesis",
    description: null,
    dueAt: null,
    allowedFileTypes: ["pdf"],
    maxFileSizeBytes: 10485760,
    status: "OPEN",
  },
  versions: [
    {
      id: "version-1",
      submissionId: "submission-1",
      versionNumber: 1,
      originalFileName: "thesis.pdf",
      fileExtension: "pdf",
      contentType: "application/pdf",
      fileSizeBytes: 2048,
      uploadedBy: "student-1",
      uploadedByName: "Student One",
      submissionNote: null,
      submittedAt: "2026-10-04T10:00:00Z",
      isLate: false,
      isCurrent: true,
      isApproved: false,
      review: null,
    },
  ],
};

const changesRequested: ResearchSubmission = {
  ...pending,
  status: "CHANGES_REQUESTED",
  versions: [
    {
      ...pending.versions[0],
      review: {
        id: "review-1",
        submissionId: "submission-1",
        versionId: "version-1",
        decision: "CHANGES_REQUESTED",
        feedback: "Correct the methodology chapter.",
        reviewedBy: "supervisor-1",
        reviewedByName: "Supervisor One",
        reviewedAt: "2026-10-04T11:00:00Z",
      },
    },
  ],
};

describe("SubmissionDetailModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getSubmission.mockResolvedValue(pending);
    api.listComments.mockResolvedValue([]);
    api.reviewSubmission.mockResolvedValue(changesRequested);
  });

  it("records a version-specific changes-requested review", async () => {
    const user = userEvent.setup();
    const onUpdated = vi.fn();
    render(
      <SubmissionDetailModal
        isOpen
        projectId="project-1"
        submission={pending}
        viewerRole="SUPERVISOR"
        onClose={vi.fn()}
        onUpdated={onUpdated}
      />,
    );

    expect(await screen.findByText("thesis.pdf")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Request changes" }));
    await user.type(
      screen.getByPlaceholderText(
        "Explain the decision and what the Student should do next",
      ),
      "Correct the methodology chapter.",
    );
    await user.click(screen.getByRole("button", { name: "Record decision" }));

    await waitFor(() => {
      expect(api.reviewSubmission).toHaveBeenCalledWith(
        "project-1",
        "submission-1",
        {
          versionId: "version-1",
          decision: "CHANGES_REQUESTED",
          feedback: "Correct the methodology chapter.",
        },
      );
    });
    expect(onUpdated).toHaveBeenCalledWith(changesRequested);
  });
});
