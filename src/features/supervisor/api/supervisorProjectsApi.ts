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
  /**
   * Refresh a complete project from the backend.
   *
   * Used after milestone operations because the backend
   * returns only ProjectMilestoneResponse for those operations.
   */
  async function refreshProject(
    projectId: string,
  ): Promise<SupervisorProjectDetail> {
    const updated = await apiClient.get<ProjectResourceDetail>(
      `${PROJECTS_RESOURCE_PATH}/${projectId}`,
    );

    const project = toSupervisorDetail(updated);

    cachedProjectsById[projectId] = project;

    return project;
  }

  return {
    // ============================================================
    // GET PROJECTS
    // GET /api/v1/projects
    // ============================================================

    async getProjects(): Promise<SupervisorProjectSummary[]> {
      const projects = await apiClient.get<ProjectResourceSummary[]>(
        PROJECTS_RESOURCE_PATH,
      );

      return projects.map(toSupervisorSummary);
    },

    // ============================================================
    // GET PROJECT BY ID
    // GET /api/v1/projects/{projectId}
    // ============================================================

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

    // ============================================================
    // CREATE PROJECT
    // POST /api/v1/projects
    // ============================================================

    async createProject(
      body: CreateSupervisorProjectRequest,
    ): Promise<CreateSupervisorProjectResponse> {
      return apiClient.post<CreateSupervisorProjectResponse>(
        PROJECTS_RESOURCE_PATH,
        body,
      );
    },

    // ============================================================
    // UPDATE PROJECT
    // PUT /api/v1/projects/{projectId}
    // ============================================================

    async updateProject(
      projectId: string,
      body: UpdateSupervisorProjectRequest,
    ): Promise<SupervisorProjectDetail> {
      const updated = await apiClient.put<ProjectResourceDetail>(
        `${PROJECTS_RESOURCE_PATH}/${projectId}`,
        body,
      );

      const project = toSupervisorDetail(updated);

      cachedProjectsById[projectId] = project;

      return project;
    },

    // ============================================================
    // ADD MILESTONE
    // POST /api/v1/projects/{projectId}/milestones
    // ============================================================

    async addProjectMilestone(
      projectId: string,
      body: AddSupervisorProjectMilestoneRequest,
    ): Promise<SupervisorProjectDetail> {
      await apiClient.post(
        `${PROJECTS_RESOURCE_PATH}/${projectId}/milestones`,
        body,
      );

      /*
       * Backend returns ProjectMilestoneResponse,
       * not the complete project.
       *
       * Refresh the project to update the cache.
       */
      return refreshProject(projectId);
    },

    // ============================================================
    // UPDATE MILESTONE
    // PUT /api/v1/projects/{projectId}/milestones/{milestoneId}
    // ============================================================

    async updateProjectMilestone(
      projectId: string,
      milestoneId: string,
      body: UpdateSupervisorProjectMilestoneRequest,
    ): Promise<SupervisorProjectDetail> {
      await apiClient.put(
        `${PROJECTS_RESOURCE_PATH}/${projectId}/milestones/${milestoneId}`,
        body,
      );

      /*
       * Backend returns ProjectMilestoneResponse,
       * not the complete project.
       *
       * Refresh the project to update the cache.
       */
      return refreshProject(projectId);
    },

    // ============================================================
    // FUTURE: UPDATE PROJECT STATUS
    // ============================================================

    async updateProjectStatus(
      projectId: string,
      body: UpdateSupervisorProjectStatusRequest,
    ): Promise<SupervisorProjectDetail> {
      /*
       * The current ProjectsController.cs does not expose
       * a dedicated project-status endpoint.
       *
       * LifecycleStatus is already part of UpdateProjectRequest,
       * so use updateProject() when changing project status.
       */
      void projectId;
      void body;

      throw new Error(
        "Use updateProject() to update lifecycleStatus. " +
          "The current ProjectService backend does not expose " +
          "a separate updateProjectStatus endpoint.",
      );
    },

    // ============================================================
    // FUTURE: UPDATE REPOSITORY
    // ============================================================

    async updateRepository(
      projectId: string,
      repositoryUrl: string | null,
    ): Promise<SupervisorProjectDetail> {
      /*
       * The current ProjectsController.cs does not expose
       * a repository endpoint.
       */
      const normalizedRepositoryUrl =
        typeof repositoryUrl === "string"
          ? normalizeGitHubRepositoryUrl(repositoryUrl)
          : null;

      const body: UpdateRepositoryRequest = {
        repositoryUrl: normalizedRepositoryUrl,
      };

      void projectId;
      void body;

      throw new Error(
        "updateRepository is not implemented by the current " +
          "ProjectService backend.",
      );
    },

    // ============================================================
    // FUTURE: ADD PROJECT MEMBERS
    // ============================================================

    async addProjectMembers(
      projectId: string,
      body: AddSupervisorProjectMembersRequest,
    ): Promise<SupervisorProjectDetail> {
      /*
       * The current ProjectsController.cs does not expose
       * an add-members endpoint.
       */
      void projectId;
      void body;

      throw new Error(
        "addProjectMembers is not implemented by the current " +
          "ProjectService backend.",
      );
    },
  };
}
