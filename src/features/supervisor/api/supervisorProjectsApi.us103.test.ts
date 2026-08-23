import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupervisorProjectsApi } from "./supervisorProjectsApi";

const apiClient = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
};

function createApi() {
  return createSupervisorProjectsApi({
    apiClient: apiClient as never,
    cachedProjectsById: {},
    inFlightProjectRequests: {},
  });
}

describe("supervisorProjectsApi US-103 full flow", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists through the canonical project resource", async () => {
    apiClient.get.mockResolvedValueOnce([]);
    await createApi().getProjects();
    expect(apiClient.get).toHaveBeenCalledWith("/api/v1/projects");
  });

  it("creates the full project payload without removing students or milestones", async () => {
    const body = {
      title: "AI Research",
      summary: "Summary",
      batch: "2026",
      semester: "Semester 1",
      studentIds: ["student-1", "student-2"],
      leaderStudentId: "student-1",
      milestones: [
        {
          title: "Proposal",
          description: "Initial proposal",
          dueDate: "2026-09-20",
        },
      ],
    };
    apiClient.post.mockResolvedValueOnce({ id: "project-1" });

    await createApi().createProject(body);

    expect(apiClient.post).toHaveBeenCalledWith("/api/v1/projects", body);
  });

  it("defaults missing member and milestone collections on project detail reads", async () => {
    apiClient.get.mockResolvedValueOnce({
      id: "project-1",
      title: "AI Research",
      summary: "Summary",
      lifecycleStatus: "PLANNING",
      batch: "2026",
      semester: "Semester 1",
      milestoneDate: null,
      lastActivityAt: null,
      progressPercent: 0,
      supervisor: null,
      leader: null,
    });

    const project = await createApi().getProjectById("project-1");

    expect(project.members).toEqual([]);
    expect(project.milestones).toEqual([]);
  });
});
