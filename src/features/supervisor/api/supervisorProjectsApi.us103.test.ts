import type {
  SupervisorProjectDetail,
  SupervisorProject,
  SupervisorStudentSearchResult,
} from "../types";

type ApiClient = {
  get: <T = unknown>(url: string) => Promise<T>;
  post: <T = unknown>(url: string, body?: unknown) => Promise<T>;
  patch: <T = unknown>(url: string, body?: unknown) => Promise<T>;
  put: <T = unknown>(url: string, body?: unknown) => Promise<T>;
  del: <T = unknown>(url: string) => Promise<T>;
};

type SupervisorProjectInFlight = Partial<
  Record<string, Promise<SupervisorProjectDetail>>
>;

type CreateSupervisorProjectsApiDeps = {
  apiClient: ApiClient;
  cachedProjectsById: Record<string, SupervisorProjectDetail>;
  inFlightProjectRequests: SupervisorProjectInFlight;
};

export function createSupervisorProjectsApi({
  apiClient,
  cachedProjectsById,
  inFlightProjectRequests,
}: CreateSupervisorProjectsApiDeps) {
  async function getProjects(): Promise<SupervisorProject[]> {
    const projects = await apiClient.get<SupervisorProject[]>(
      "/api/v1/projects",
    );

    return projects ?? [];
  }

  async function getProjectById(
    projectId: string,
  ): Promise<SupervisorProjectDetail> {
    const cachedProject = cachedProjectsById[projectId];

    if (cachedProject) {
      return cachedProject;
    }

    const existingRequest = inFlightProjectRequests[projectId];

    if (existingRequest) {
      return existingRequest;
    }

    const request = apiClient
      .get<SupervisorProjectDetail>(`/api/v1/projects/${projectId}`)
      .then((project) => ({
        ...project,
        members: project.members ?? [],
        milestones: project.milestones ?? [],
      }))
      .then((project) => {
        cachedProjectsById[projectId] = project;
        return project;
      })
      .finally(() => {
        delete inFlightProjectRequests[projectId];
      });

    inFlightProjectRequests[projectId] = request;

    return request;
  }

  async function createProject(body: unknown) {
    const project = await apiClient.post<SupervisorProject>(
      "/api/v1/projects",
      body,
    );

    return project;
  }

  async function updateProject(
    projectId: string,
    body: unknown,
  ): Promise<SupervisorProjectDetail> {
    const project = await apiClient.patch<SupervisorProjectDetail>(
      `/api/v1/projects/${projectId}`,
      body,
    );

    const normalizedProject: SupervisorProjectDetail = {
      ...project,
      members: project.members ?? [],
      milestones: project.milestones ?? [],
    };

    cachedProjectsById[projectId] = normalizedProject;

    return normalizedProject;
  }

  async function deleteProject(projectId: string) {
    await apiClient.del(`/api/v1/projects/${projectId}`);

    delete cachedProjectsById[projectId];
    delete inFlightProjectRequests[projectId];
  }

  async function searchStudents(
    query: string,
  ): Promise<SupervisorStudentSearchResult[]> {
    if (!query.trim()) {
      return [];
    }

    const result = await apiClient.get<SupervisorStudentSearchResult[]>(
      `/api/v1/students/search?q=${encodeURIComponent(query.trim())}`,
    );

    return result ?? [];
  }

  async function updateProjectTeam(
    projectId: string,
    body: unknown,
  ): Promise<SupervisorProjectDetail> {
    const project = await apiClient.put<SupervisorProjectDetail>(
      `/api/v1/projects/${projectId}/team`,
      body,
    );

    const normalizedProject: SupervisorProjectDetail = {
      ...project,
      members: project.members ?? [],
      milestones: project.milestones ?? [],
    };

    cachedProjectsById[projectId] = normalizedProject;

    return normalizedProject;
  }

  async function updateProjectMilestone(
    projectId: string,
    milestoneId: string,
    body: unknown,
  ): Promise<SupervisorProjectDetail> {
    const project = await apiClient.patch<SupervisorProjectDetail>(
      `/api/v1/projects/${projectId}/milestones/${milestoneId}`,
      body,
    );

    const normalizedProject: SupervisorProjectDetail = {
      ...project,
      members: project.members ?? [],
      milestones: project.milestones ?? [],
    };

    cachedProjectsById[projectId] = normalizedProject;

    return normalizedProject;
  }

  return {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    searchStudents,
    updateProjectTeam,
    updateProjectMilestone,
  };
}