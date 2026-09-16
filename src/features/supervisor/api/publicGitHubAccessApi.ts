import { publicApiClient } from "@/services/apiClient";
import type {
  GitHubAccessUpdatedAcknowledge,
  GitHubAccessUpdatedSummary,
  GitHubRepositoryAccessRequestContinue,
  GitHubRepositoryAccessRequestValidation,
} from "../types";

const validationRequests = new Map<
  string,
  Promise<GitHubRepositoryAccessRequestValidation>
>();

function cacheValidation(
  token: string,
  request: () => Promise<GitHubRepositoryAccessRequestValidation>,
): Promise<GitHubRepositoryAccessRequestValidation> {
  const cached = validationRequests.get(token);
  if (cached) return cached;

  const pending = request().catch((error: unknown) => {
    validationRequests.delete(token);
    throw error;
  });
  validationRequests.set(token, pending);
  return pending;
}

export const publicGitHubAccessApi = {
  validate(token: string): Promise<GitHubRepositoryAccessRequestValidation> {
    return cacheValidation(token, () => {
      const params = new URLSearchParams({ token });
      return publicApiClient.get<GitHubRepositoryAccessRequestValidation>(
        `/api/github/access-requests/validate?${params.toString()}`,
      );
    });
  },

  continue(token: string): Promise<GitHubRepositoryAccessRequestContinue> {
    const params = new URLSearchParams({ token });
    return publicApiClient.post<GitHubRepositoryAccessRequestContinue>(
      `/api/github/access-requests/continue?${params.toString()}`,
      {},
    );
  },

  getResult(token: string): Promise<GitHubAccessUpdatedSummary> {
    const params = new URLSearchParams({ token });
    return publicApiClient.get<GitHubAccessUpdatedSummary>(
      `/api/github/access-updated/summary?${params.toString()}`,
    );
  },

  acknowledgeResult(token: string): Promise<GitHubAccessUpdatedAcknowledge> {
    const params = new URLSearchParams({ token });
    return publicApiClient.post<GitHubAccessUpdatedAcknowledge>(
      `/api/github/access-updated/acknowledge?${params.toString()}`,
      {},
    );
  },
};

export function clearPublicGitHubAccessValidationCacheForTests(): void {
  validationRequests.clear();
}
