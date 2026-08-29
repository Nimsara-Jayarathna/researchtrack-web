import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useStudentProject } from "./useStudentProject";

const getProjectById = vi.hoisted(() => vi.fn());

vi.mock("../api/studentApi", () => ({
  studentApi: {
    getProjectById,
  },
}));

describe("useStudentProject membership revalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("forces a backend read whenever the project detail route mounts", async () => {
    getProjectById.mockResolvedValue({ id: "project-1", title: "Project" });

    const { result } = renderHook(() => useStudentProject("project-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(getProjectById).toHaveBeenCalledWith("project-1", true);
  });
});
