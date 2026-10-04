import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StudentSubmissionsSection } from "./StudentSubmissionsSection";
import type {
  ResearchSubmission,
  SubmissionRequirement,
  SubmissionVersion,
} from "../types";

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

vi.mock("@/features/auth/state/authState", () => ({
  useAuthStateValue: () => ({
    user: { id: "student-1" },
    status: "authenticated",
    isLoading: false,
    error: null,
  }),
}));

vi.mock("./SubmissionUploadModal", () => ({
  SubmissionUploadModal: ({
    requirement,
  }: {
    requirement: SubmissionRequirement | null;
  }) =>
    requirement ? (
      <div data-testid="upload-modal">upload:{requirement.title}</div>
    ) : null,
}));

vi.mock("./SubmissionPreviewModal", () => ({
  SubmissionPreviewModal: ({
    version,
  }: {
    version: SubmissionVersion | null;
  }) =>
    version ? (
      <div data-testid="preview-modal">preview:{version.originalFileName}</div>
    ) : null,
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
  responsibility: {
    mode: "PROJECT_LEADER",
    assignedStudentId: null,
    assignedStudentName: null,
    responsibleStudentId: "student-1",
    responsibleStudentName: "Student One",
    responsibleStudentRole: "PROJECT_LEADER",
    requiresAssignment: false,
  },
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
    responsibility: requirement.responsibility,
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
      submitterRoleSnapshot: "PROJECT_LEADER",
      responsibilityModeSnapshot: "PROJECT_LEADER",
      submissionNote: "Initial submission",
      submittedAt: "2026-10-03T12:00:00Z",
      isLate: false,
      isCurrent: true,
      isApproved: false,
      review: null,
    },
  ],
};

describe("StudentSubmissionsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    submissionApiMock.listRequirements.mockResolvedValue([requirement]);
    submissionApiMock.listSubmissions.mockResolvedValue([]);
  });

  it("shows an OPEN requirement as ready and expands its workflow details", async () => {
    const user = userEvent.setup();
    render(<StudentSubmissionsSection projectId="project-1" />);

    expect(await screen.findByText("Research Proposal")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit file" })).toBeEnabled();

    await user.click(
      screen.getByRole("button", { name: "Expand Research Proposal" }),
    );
    expect(
      screen.getByText(
        "No document has been submitted for this requirement yet.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Submit file" }));
    expect(screen.getByTestId("upload-modal")).toHaveTextContent(
      "upload:Research Proposal",
    );
  });

  it("keeps a submitted card compact and opens the in-app preview", async () => {
    submissionApiMock.listSubmissions.mockResolvedValue([submission]);

    const user = userEvent.setup();
    render(<StudentSubmissionsSection projectId="project-1" />);

    expect(await screen.findAllByText("proposal.pdf")).toHaveLength(2);
    expect(screen.getByText("PENDING REVIEW")).toBeInTheDocument();
    expect(
      screen.getAllByLabelText("Project Leader: Student One").length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: "Submit file" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Preview" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/This recorded version is immutable/i),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Expand Research Proposal" }),
    );
    await user.click(screen.getByRole("button", { name: "Preview" }));
    expect(screen.getByTestId("preview-modal")).toHaveTextContent(
      "preview:proposal.pdf",
    );
  });

  it("keeps official upload actions hidden from project members who are not responsible", async () => {
    submissionApiMock.listRequirements.mockResolvedValue([
      {
        ...requirement,
        responsibility: {
          mode: "ASSIGNED_STUDENT",
          assignedStudentId: "student-2",
          assignedStudentName: "Student Two",
          responsibleStudentId: "student-2",
          responsibleStudentName: "Student Two",
          responsibleStudentRole: "ASSIGNED_STUDENT",
          requiresAssignment: false,
        },
      },
    ]);

    render(<StudentSubmissionsSection projectId="project-1" />);

    expect(await screen.findByText("Research Proposal")).toBeInTheDocument();
    expect(screen.getByText("Team submissions")).toBeInTheDocument();
    expect(
      screen.getAllByLabelText("Assigned submitter: Student Two").length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: "Submit file" }),
    ).not.toBeInTheDocument();
  });
});
