import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStudentProjectsApi } from "./studentProjectsApi";

const apiClient = { get: vi.fn() };

function createApi() {
  return createStudentProjectsApi({
    apiClient: apiClient as never,
    cachedProjectsById: {},
    inFlightProjectRequests: {},
  });
}

describe("studentProjectsApi US-103 membership reads", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses the same canonical project collection as supervisors", async () => {
    apiClient.get.mockResolvedValueOnce([]);
    await createApi().getProjects();
    expect(apiClient.get).toHaveBeenCalledWith("/api/v1/projects");
  });

  it("maps the canonical lifecycle field to the student status view model", async () => {
    apiClient.get.mockResolvedValueOnce([
      {
        id: "project-1",
        title: "AI Research",
        summary: "Summary",
        lifecycleStatus: "PLANNING",
        batch: "2026",
        semester: "Semester 1",
        milestoneDate: "2026-09-20",
        lastActivityAt: "2026-08-23T00:00:00Z",
        progressPercent: 0,
        memberCount: 3,
        supervisorName: "Supervisor One",
      },
    ]);

    const projects = await createApi().getProjects();
    expect(projects[0]?.status).toBe("PLANNING");
    expect(projects[0]?.supervisorName).toBe("Supervisor One");
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
