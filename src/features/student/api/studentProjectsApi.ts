import {
  PROJECTS_RESOURCE_PATH,
  createEmptyProjectGitHubPreview,
  type ProjectResourceDetail,
  type ProjectResourceSummary,
} from "@/features/projects/api/projectResource";
import type { StudentProjectDetail, StudentProjectSummary } from "../types";

type ApiClient = typeof import("@/services/apiClient").apiClient;

type StudentProjectCache = Partial<Record<string, StudentProjectDetail>>;
type StudentProjectInFlight = Partial<
  Record<string, Promise<StudentProjectDetail>>
>;

type CreateStudentProjectsApiDeps = {
  apiClient: ApiClient;
  cachedProjectsById: StudentProjectCache;
  inFlightProjectRequests: StudentProjectInFlight;
};

function toStudentSummary(
  project: ProjectResourceSummary,
): StudentProjectSummary {
  return {
    id: project.id,
    title: project.title,
    summary: project.summary,
    status: project.lifecycleStatus,
    batch: project.batch,
    semester: project.semester,
    milestoneDate: project.milestoneDate,
    lastActivityAt: project.lastActivityAt,
    progressPercent: project.progressPercent,
    supervisorName: project.supervisorName,
  };
}

function toStudentDetail(project: ProjectResourceDetail): StudentProjectDetail {
  return {
    id: project.id,
    title: project.title,
    summary: project.summary,
    status: project.lifecycleStatus,
    batch: project.batch,
    semester: project.semester,
    milestoneDate: project.milestoneDate,
    lastActivityAt: project.lastActivityAt,
    progressPercent: project.progressPercent,
    repositoryUrl: null,
    github: createEmptyProjectGitHubPreview(),
    githubRepositories: null,
    jira: null,
    leader: project.leader,
    members: project.members ?? [],
    milestones: project.milestones ?? [],
    files: null,
  };
}

export function createStudentProjectsApi({
  apiClient,
  cachedProjectsById,
  inFlightProjectRequests,
}: CreateStudentProjectsApiDeps) {
  return {
    async getProjects(): Promise<StudentProjectSummary[]> {
      const projects = await apiClient.get<ProjectResourceSummary[]>(
        PROJECTS_RESOURCE_PATH,
      );
      return projects.map(toStudentSummary);
    },

    async getProjectById(
      projectId: string,
      forceRefresh = false,
    ): Promise<StudentProjectDetail> {
      if (!forceRefresh && cachedProjectsById[projectId]) {
        return cachedProjectsById[projectId] as StudentProjectDetail;
      }

      if (inFlightProjectRequests[projectId]) {
        return inFlightProjectRequests[
          projectId
        ] as Promise<StudentProjectDetail>;
      }

      const request = apiClient
        .get<ProjectResourceDetail>(`${PROJECTS_RESOURCE_PATH}/${projectId}`)
        .then(toStudentDetail);
      inFlightProjectRequests[projectId] = request;

      try {
        const project = await request;
        cachedProjectsById[projectId] = project;
        return project;
      } catch (error) {
        if (forceRefresh) {
          delete cachedProjectsById[projectId];
        }
        throw error;
      } finally {
        delete inFlightProjectRequests[projectId];
      }
    },
  };
}
