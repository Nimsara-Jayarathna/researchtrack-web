import { describe, expect, it, vi } from "vitest";
import { createSupervisorStudentsApi } from "./supervisorStudentsApi";

describe("supervisorStudentsApi US-103", () => {
  it("searches the canonical AuthService student directory", async () => {
    const apiClient = { get: vi.fn().mockResolvedValue([]) };
    const api = createSupervisorStudentsApi({ apiClient: apiClient as never });

    await api.searchStudents("Ann");

    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/v1/users/students?query=Ann",
    );
  });
});
