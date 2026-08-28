import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupervisorProjectsApi } from "./supervisorProjectsApi";

const apiClient = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
};

function projectResource(members: unknown[] = []) {
  return {
    id: "project-1",
    title: "AI Research",
    summary: "Summary",
    lifecycleStatus: "ACTIVE",
    batch: "2026",
    semester: "Semester 1",
    milestoneDate: null,
    lastActivityAt: "2026-08-28T10:00:00Z",
    progressPercent: 20,
    supervisor: null,
    leader: null,
    members,
    milestones: [],
  };
}

function createApi(cache: Record<string, never> = {}) {
  return createSupervisorProjectsApi({
    apiClient: apiClient as never,
    cachedProjectsById: cache,
    inFlightProjectRequests: {},
  });
}

describe("supervisorProjectsApi US-105 membership flow", () => {
  beforeEach(() => vi.clearAllMocks());

  it("adds students through the canonical project membership endpoint", async () => {
    const body = { studentIds: ["student-3"] };
    apiClient.post.mockResolvedValueOnce(
      projectResource([
        {
          id: "student-3",
          firstName: "Cara",
          lastName: "Student",
          email: "cara@students.example.edu",
          registrationNumber: "ST00000003",
          memberRole: "STUDENT",
        },
      ]),
    );

    const project = await createApi().addProjectMembers("project-1", body);

    expect(apiClient.post).toHaveBeenCalledWith(
      "/api/v1/projects/project-1/members",
      body,
    );
    expect(project.members).toHaveLength(1);
    expect(project.members[0]?.id).toBe("student-3");
  });

  it("removes a student and returns the authoritative updated project", async () => {
    apiClient.del.mockResolvedValueOnce(projectResource([]));

    const project = await createApi().removeProjectMember(
      "project-1",
      "student-2",
    );

    expect(apiClient.del).toHaveBeenCalledWith(
      "/api/v1/projects/project-1/members/student-2",
    );
    expect(project.members).toEqual([]);
  });
});
