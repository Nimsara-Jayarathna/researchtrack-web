import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StudentSubmissionsSection } from "./StudentSubmissionsSection";
import type { ResearchSubmission, SubmissionRequirement } from "../types";

const { submissionApiMock } = vi.hoisted(() => ({
  submissionApiMock: {
    listRequirements: vi.fn(),
    listSubmissions: vi.fn(),
    getDownloadUrl: vi.fn(),
  },
}));

vi.mock("../api/submissionApi", () => ({
  submissionApi: submissionApiMock,
}));

vi.mock("./SubmissionUploadModal", () => ({
  SubmissionUploadModal: ({ requirement }: { requirement: SubmissionRequirement | null }) =>
    requirement ? <div data-testid="upload-modal">upload:{requirement.title}</div> : null,
}));

const requirement: SubmissionRequirement = {
  id: "requirement-1",
  projectId: "project-1",
  title: "Research Proposal",
  description: "Upload the final proposal.",
  dueAt: "2026-10-20T12:00:00Z",
  allowedFileTypes: ["pdf", "docx"],
  maxFileSizeBytes: 10 * 1024 * 1024,
  status: "OPEN",
  createdBy: "supervisor-1",
  createdByName: "Supervisor",
  createdAt: "2026-10-01T12:00:00Z",
  updatedAt: null,
  submissionSummary: null,
};

const submission: ResearchSubmission = {
  id: "submission-1",
  projectId: "project-1",
  requirementId: "requirement-1",
  status: "PENDING_REVIEW",
  versionCount: 1,
  currentVersionId: "version-1",
  approvedVersionId: null,
  lastSubmittedAt: "2026-10-03T12:00:00Z",
  approvedAt: null,
  requirement: {
    id: "requirement-1",
    title: "Research Proposal",
    description: "Upload the final proposal.",
    dueAt: "2026-10-20T12:00:00Z",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeBytes: 10 * 1024 * 1024,
    status: "OPEN",
  },
  versions: [
    {
      id: "version-1",
      submissionId: "submission-1",
      versionNumber: 1,
      originalFileName: "proposal.pdf",
      fileExtension: "pdf",
      contentType: "application/pdf",
      fileSizeBytes: 2048,
      uploadedBy: "student-1",
      uploadedByName: "Student One",
      submissionNote: "Initial submission",
      submittedAt: "2026-10-03T12:00:00Z",
      isLate: false,
      isCurrent: true,
      isApproved: false,
    },
  ],
};

describe("StudentSubmissionsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    submissionApiMock.listRequirements.mockResolvedValue([requirement]);
    submissionApiMock.listSubmissions.mockResolvedValue([]);
    submissionApiMock.getDownloadUrl.mockResolvedValue({
      url: "https://example.test/file",
      expiresAt: "2026-10-03T12:05:00Z",
    });
    vi.spyOn(window, "open").mockImplementation(() => null);
  });

  it("shows an OPEN requirement as ready for the student's initial submission", async () => {
    const user = userEvent.setup();
    render(<StudentSubmissionsSection projectId="project-1" />);

    expect(await screen.findByText("Research Proposal")).toBeInTheDocument();
    expect(screen.getByText("No document has been submitted for this requirement yet.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit file" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Submit file" }));
    expect(screen.getByTestId("upload-modal")).toHaveTextContent("upload:Research Proposal");
  });

  it("shows the recorded immutable current version and secure file actions", async () => {
    submissionApiMock.listSubmissions.mockResolvedValue([submission]);

    const user = userEvent.setup();
    render(<StudentSubmissionsSection projectId="project-1" />);

    expect(await screen.findByText("proposal.pdf")).toBeInTheDocument();
    expect(screen.getByText("PENDING REVIEW")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit file" })).not.toBeInTheDocument();
    expect(screen.getByText(/immutable/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Preview" }));

    await waitFor(() => {
      expect(submissionApiMock.getDownloadUrl).toHaveBeenCalledWith(
        "project-1",
        "submission-1",
        "version-1",
        "inline",
      );
    });
    expect(window.open).toHaveBeenCalledWith(
      "https://example.test/file",
      "_blank",
      "noopener,noreferrer",
    );
  });
});
