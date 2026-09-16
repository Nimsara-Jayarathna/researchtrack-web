import { apiClient } from "@/services/apiClient";
import { toVersionedApiPath } from "@/app/config/apiVersion";
import { registerSessionCacheClearer } from "@/services/sessionCache";
import { createRoleProjectApi } from "@/features/shared/api/createRoleProjectApi";
import { clearRecord } from "@/services/apiCacheUtils";
import type { StudentProjectDetail } from "../types";
import type { ProjectGitHubRepositories } from "@/features/shared/types/github.types";
import { createStudentProjectsApi } from "./studentProjectsApi";

const PROJECTS_BASE_PATH = toVersionedApiPath("/api/projects");

const cachedProjectsById: Partial<Record<string, StudentProjectDetail>> = {};
const inFlightProjectRequests: Partial<
  Record<string, Promise<StudentProjectDetail>>
> = {};
const { clearCache: clearRoleProjectCache, ...roleProjectApi } =
  createRoleProjectApi({
    apiClient,
    roleBasePath: "/api/student",
  });
const studentProjectsApi = createStudentProjectsApi({
  apiClient,
  cachedProjectsById,
  inFlightProjectRequests,
});

function clearStudentApiCache() {
  clearRecord(cachedProjectsById);
  clearRecord(inFlightProjectRequests);
  clearRoleProjectCache();
}

registerSessionCacheClearer(clearStudentApiCache);

export const studentApi = {
  clearCache(): void {
    clearStudentApiCache();
  },

  ...roleProjectApi,
  ...studentProjectsApi,

  getProjectGitHubRepositories(
    projectId: string,
  ): Promise<ProjectGitHubRepositories> {
    return apiClient.get<ProjectGitHubRepositories>(
      `${PROJECTS_BASE_PATH}/${projectId}/github-repositories`,
    );
  },
};
