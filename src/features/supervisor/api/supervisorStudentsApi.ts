import { STUDENT_DIRECTORY_PATH } from "@/features/projects/api/projectResource";
import type { SupervisorStudentSearchResult } from "../types";

type ApiClient = typeof import("@/services/apiClient").apiClient;

type CreateSupervisorStudentsApiDeps = {
  apiClient: ApiClient;
};

export function createSupervisorStudentsApi({
  apiClient,
}: CreateSupervisorStudentsApiDeps) {
  return {
    searchStudents(query: string): Promise<SupervisorStudentSearchResult[]> {
      const params = new URLSearchParams({ query });
      return apiClient.get<SupervisorStudentSearchResult[]>(
        `${STUDENT_DIRECTORY_PATH}?${params.toString()}`,
      );
    },
  };
}
