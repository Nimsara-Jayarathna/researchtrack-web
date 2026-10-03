import { apiClient } from "@/services/apiClient";
import type {
  CreateUploadSessionRequest,
  DownloadGrant,
  RequirementMutation,
  ResearchSubmission,
  SubmissionRequirement,
  UploadSession,
} from "../types";

function base(projectId: string) {
  return `/api/v1/projects/${projectId}/submissions`;
}

export const submissionApi = {
  listRequirements(projectId: string): Promise<SubmissionRequirement[]> {
    return apiClient.get<SubmissionRequirement[]>(
      `${base(projectId)}/requirements`,
    );
  },

  listSubmissions(projectId: string): Promise<ResearchSubmission[]> {
    return apiClient.get<ResearchSubmission[]>(base(projectId));
  },

  createRequirement(
    projectId: string,
    payload: RequirementMutation,
  ): Promise<SubmissionRequirement> {
    return apiClient.post<SubmissionRequirement>(
      `${base(projectId)}/requirements`,
      payload,
    );
  },

  updateRequirement(
    projectId: string,
    requirementId: string,
    payload: RequirementMutation,
  ): Promise<SubmissionRequirement> {
    return apiClient.patch<SubmissionRequirement>(
      `${base(projectId)}/requirements/${requirementId}`,
      payload,
    );
  },

  closeRequirement(
    projectId: string,
    requirementId: string,
  ): Promise<SubmissionRequirement> {
    return apiClient.post<SubmissionRequirement>(
      `${base(projectId)}/requirements/${requirementId}/close`,
      {},
    );
  },

  reopenRequirement(
    projectId: string,
    requirementId: string,
  ): Promise<SubmissionRequirement> {
    return apiClient.post<SubmissionRequirement>(
      `${base(projectId)}/requirements/${requirementId}/reopen`,
      {},
    );
  },

  archiveRequirement(
    projectId: string,
    requirementId: string,
  ): Promise<SubmissionRequirement> {
    return apiClient.post<SubmissionRequirement>(
      `${base(projectId)}/requirements/${requirementId}/archive`,
      {},
    );
  },

  deleteRequirement(projectId: string, requirementId: string): Promise<void> {
    return apiClient.del<void>(
      `${base(projectId)}/requirements/${requirementId}`,
    );
  },

  createUploadSession(
    projectId: string,
    requirementId: string,
    payload: CreateUploadSessionRequest,
  ): Promise<UploadSession> {
    return apiClient.post<UploadSession>(
      `${base(projectId)}/requirements/${requirementId}/upload-sessions`,
      payload,
    );
  },

  completeUploadSession(
    projectId: string,
    uploadSessionId: string,
  ): Promise<ResearchSubmission> {
    return apiClient.post<ResearchSubmission>(
      `${base(projectId)}/upload-sessions/${uploadSessionId}/complete`,
      {},
    );
  },

  getSubmission(
    projectId: string,
    submissionId: string,
  ): Promise<ResearchSubmission> {
    return apiClient.get<ResearchSubmission>(
      `${base(projectId)}/${submissionId}`,
    );
  },

  getDownloadUrl(
    projectId: string,
    submissionId: string,
    versionId: string,
    disposition: "inline" | "attachment" = "inline",
  ): Promise<DownloadGrant> {
    return apiClient.get<DownloadGrant>(
      `${base(projectId)}/${submissionId}/versions/${versionId}/download-url?disposition=${disposition}`,
    );
  },
};
