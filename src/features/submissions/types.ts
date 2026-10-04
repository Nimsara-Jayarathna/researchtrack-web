export type SubmissionRequirementStatus = "OPEN" | "CLOSED" | "ARCHIVED";
export type SubmissionStatus =
  "PENDING_REVIEW" | "CHANGES_REQUESTED" | "APPROVED" | "REJECTED";
export type ReviewDecision = "APPROVED" | "CHANGES_REQUESTED" | "REJECTED";
export type SubmissionParticipantRole = "STUDENT" | "SUPERVISOR";

export type SubmissionSummary = {
  id: string;
  status: SubmissionStatus;
  versionCount: number;
  currentVersionNumber: number | null;
  lastSubmittedAt: string;
};

export type SubmissionRequirement = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  allowedFileTypes: string[];
  maxFileSizeBytes: number;
  status: SubmissionRequirementStatus;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string | null;
  submissionSummary: SubmissionSummary | null;
};

export type RequirementMutation = {
  title: string;
  description: string | null;
  dueAt: string | null;
  allowedFileTypes: string[];
  maxFileSizeBytes: number;
};

export type CreateUploadSessionRequest = {
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  submissionNote: string | null;
};

export type UploadSession = {
  uploadSessionId: string;
  uploadUrl: string;
  expiresAt: string;
  versionNumber: number;
  maxFileSizeBytes: number;
  requiredHeaders: Record<string, string>;
};

export type SubmissionReview = {
  id: string;
  submissionId: string;
  versionId: string;
  decision: ReviewDecision;
  feedback: string | null;
  reviewedBy: string;
  reviewedByName: string;
  reviewedAt: string;
};

export type SubmissionVersion = {
  id: string;
  submissionId: string;
  versionNumber: number;
  originalFileName: string;
  fileExtension: string;
  contentType: string;
  fileSizeBytes: number;
  uploadedBy: string;
  uploadedByName: string;
  submissionNote: string | null;
  submittedAt: string;
  isLate: boolean;
  isCurrent: boolean;
  isApproved: boolean;
  review: SubmissionReview | null;
};

export type ResearchSubmission = {
  id: string;
  projectId: string;
  requirementId: string;
  status: SubmissionStatus;
  versionCount: number;
  currentVersionId: string;
  approvedVersionId: string | null;
  lastSubmittedAt: string;
  approvedAt: string | null;
  requirement: {
    id: string;
    title: string;
    description: string | null;
    dueAt: string | null;
    allowedFileTypes: string[];
    maxFileSizeBytes: number;
    status: SubmissionRequirementStatus;
  };
  versions: SubmissionVersion[];
};

export type DownloadGrant = {
  url: string;
  expiresAt: string;
};

export type CreateSubmissionReviewRequest = {
  versionId: string;
  decision: ReviewDecision;
  feedback: string | null;
};
