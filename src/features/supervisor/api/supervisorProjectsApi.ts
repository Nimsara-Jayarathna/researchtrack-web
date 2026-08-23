import {
  PROJECTS_RESOURCE_PATH,
  createEmptyProjectGitHubPreview,
  type ProjectResourceDetail,
  type ProjectResourceSummary,
} from "@/features/projects/api/projectResource";
import type {
  AddSupervisorProjectMembersRequest,
  AddSupervisorProjectMilestoneRequest,
  CreateSupervisorProjectRequest,
  CreateSupervisorProjectResponse,
  SupervisorProjectDetail,
  SupervisorProjectSummary,
  UpdateRepositoryRequest,
  UpdateSupervisorProjectMilestoneRequest,
  UpdateSupervisorProjectRequest,
  UpdateSupervisorProjectStatusRequest,
} from "../types";
import { normalizeGitHubRepositoryUrl } from "../utils/githubRepositoryUrl";

type ApiClient = typeof import("@/services/apiClient").apiClient;

type SupervisorProjectCache = Partial<Record<string, SupervisorProjectDetail>>;
type SupervisorProjectInFlight = Partial<
  Record<string, Promise<SupervisorProjectDetail>>
>;

type CreateSupervisorProjectsApiDeps = {
  apiClient: ApiClient;
  cachedProjectsById: SupervisorProjectCache;
  inFlightProjectRequests: SupervisorProjectInFlight;
};

function toSupervisorSummary(
  project: ProjectResourceSummary,
): SupervisorProjectSummary {
  return {
    id: project.id,
    title: project.title,
    summary: project.summary,
    lifecycleStatus: project.lifecycleStatus,
    batch: project.batch,
    semester: project.semester,
    milestoneDate: project.milestoneDate,
    progressPercent: project.progressPercent,
    memberCount: project.memberCount,
  };
}

function toSupervisorDetail(
  project: ProjectResourceDetail,
): SupervisorProjectDetail {
  return {
    id: project.id,
    title: project.title,
    summary: project.summary,
    lifecycleStatus: project.lifecycleStatus,
    batch: project.batch,
    semester: project.semester,
    milestoneDate: project.milestoneDate,
    progressPercent: project.progressPercent,
    lastActivityAt: project.lastActivityAt,
    repositoryUrl: null,
    github: createEmptyProjectGitHubPreview(),
    githubRepositories: null,
    jira: null,
    leader: project.leader,
    members: project.members ?? [],
    milestones: project.milestones ?? [],
    milestoneInsights: null,
    files: null,
  };
}

export function createSupervisorProjectsApi({
  apiClient,
  cachedProjectsById,
  inFlightProjectRequests,
}: CreateSupervisorProjectsApiDeps) {
  return {
    async getProjects(): Promise<SupervisorProjectSummary[]> {
      const projects = await apiClient.get<ProjectResourceSummary[]>(
        PROJECTS_RESOURCE_PATH,
      );
      return projects.map(toSupervisorSummary);
    },

    async getProjectById(
      projectId: string,
      forceRefresh = false,
    ): Promise<SupervisorProjectDetail> {
      if (!forceRefresh && cachedProjectsById[projectId]) {
        return cachedProjectsById[projectId] as SupervisorProjectDetail;
      }

      if (!forceRefresh && inFlightProjectRequests[projectId]) {
        return inFlightProjectRequests[
          projectId
        ] as Promise<SupervisorProjectDetail>;
      }

      const request = apiClient
        .get<ProjectResourceDetail>(`${PROJECTS_RESOURCE_PATH}/${projectId}`)
        .then(toSupervisorDetail);
      inFlightProjectRequests[projectId] = request;

      try {
        const project = await request;
        cachedProjectsById[projectId] = project;
        return project;
      } finally {
        delete inFlightProjectRequests[projectId];
      }
    },

    createProject(
      body: CreateSupervisorProjectRequest,
    ): Promise<CreateSupervisorProjectResponse> {
      return apiClient.post<CreateSupervisorProjectResponse>(
        PROJECTS_RESOURCE_PATH,
        body,
      );
    },

    // The operations below belong to later stories and intentionally keep their
    // existing contracts until those .NET backend slices are implemented.
    async updateProject(
      projectId: string,
      body: UpdateSupervisorProjectRequest,
    ): Promise<SupervisorProjectDetail> {
      const updated = await apiClient.patch<SupervisorProjectDetail>(
        `/api/supervisor/projects/${projectId}`,
        body,
      );
      cachedProjectsById[projectId] = updated;
      return updated;
    },

    async updateProjectStatus(
      projectId: string,
      body: UpdateSupervisorProjectStatusRequest,
    ): Promise<SupervisorProjectDetail> {
      const updated = await apiClient.patch<SupervisorProjectDetail>(
        `/api/supervisor/projects/${projectId}/status`,
        body,
      );
      cachedProjectsById[projectId] = updated;
      return updated;
    },

    async updateRepository(
      projectId: string,
      repositoryUrl: string | null,
    ): Promise<SupervisorProjectDetail> {
      const normalizedRepositoryUrl =
        typeof repositoryUrl === "string"
          ? normalizeGitHubRepositoryUrl(repositoryUrl)
          : null;
      const body: UpdateRepositoryRequest = {
        repositoryUrl: normalizedRepositoryUrl,
      };
      const updated = await apiClient.patch<SupervisorProjectDetail>(
        `/api/supervisor/projects/${projectId}/repository`,
        body,
      );
      cachedProjectsById[projectId] = updated;
      return updated;
    },

    async addProjectMembers(
      projectId: string,
      body: AddSupervisorProjectMembersRequest,
    ): Promise<SupervisorProjectDetail> {
      const updated = await apiClient.post<SupervisorProjectDetail>(
        `/api/supervisor/projects/${projectId}/members`,
        body,
      );
      cachedProjectsById[projectId] = updated;
      return updated;
    },

    async addProjectMilestone(
      projectId: string,
      body: AddSupervisorProjectMilestoneRequest,
    ): Promise<SupervisorProjectDetail> {
      const updated = await apiClient.post<SupervisorProjectDetail>(
        `/api/supervisor/projects/${projectId}/milestones`,
        body,
      );
      cachedProjectsById[projectId] = updated;
      return updated;
    },

    async updateProjectMilestone(
      projectId: string,
      milestoneId: string,
      body: UpdateSupervisorProjectMilestoneRequest,
    ): Promise<SupervisorProjectDetail> {
      const updated = await apiClient.patch<SupervisorProjectDetail>(
        `/api/supervisor/projects/${projectId}/milestones/${milestoneId}`,
        body,
      );
      cachedProjectsById[projectId] = updated;
      return updated;
    },
  };
}
