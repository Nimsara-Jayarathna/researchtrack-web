import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invalidateStudentProjectsCache,
  useStudentProjects,
} from "./useStudentProjects";

const getProjects = vi.hoisted(() => vi.fn());
const getSessionVersion = vi.hoisted(() => vi.fn(() => 1));
const isCurrentSession = vi.hoisted(() => vi.fn(() => true));

vi.mock("../api/studentApi", () => ({
  studentApi: {
    getProjects,
  },
}));

vi.mock("@/services/sessionState", () => ({
  getSessionVersion,
  isCurrentSession,
}));

describe("useStudentProjects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateStudentProjectsCache();
    getSessionVersion.mockReturnValue(1);
    isCurrentSession.mockReturnValue(true);
  });

  it("does not commit stale response from previous session version", async () => {
    getProjects.mockResolvedValueOnce([{ id: "a", title: "User A Project" }]);
    isCurrentSession.mockReturnValue(false);

    const { result } = renderHook(() => useStudentProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.projects).toEqual([]);
  });

  it("loads projects when session is current", async () => {
    getProjects.mockResolvedValueOnce([{ id: "b", title: "User B Project" }]);

    const { result } = renderHook(() => useStudentProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.projects).toEqual([
      { id: "b", title: "User B Project" },
    ]);
  });

  it("revalidates the project collection when the Student home mounts again", async () => {
    getProjects
      .mockResolvedValueOnce([{ id: "a", title: "First Assignment" }])
      .mockResolvedValueOnce([{ id: "b", title: "Updated Assignment" }]);

    const firstMount = renderHook(() => useStudentProjects());
    await waitFor(() => {
      expect(firstMount.result.current.isLoading).toBe(false);
    });
    expect(firstMount.result.current.projects).toEqual([
      { id: "a", title: "First Assignment" },
    ]);
    firstMount.unmount();

    const secondMount = renderHook(() => useStudentProjects());
    await waitFor(() => {
      expect(secondMount.result.current.isLoading).toBe(false);
    });

    expect(getProjects).toHaveBeenCalledTimes(2);
    expect(secondMount.result.current.projects).toEqual([
      { id: "b", title: "Updated Assignment" },
    ]);
  });
});
