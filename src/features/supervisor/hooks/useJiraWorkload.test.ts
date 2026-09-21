import { act, renderHook, waitFor } from "@testing-library/react";
import { useJiraWorkload } from "./useJiraWorkload";
import type { JiraWorkload } from "../types";

const workloadA: JiraWorkload = {
  members: [
    {
      accountId: "account-1",
      displayName: "Alice Supervisor",
      total: 5,
      active: 3,
      toDo: 0,
      inProgress: 3,
      done: 2,
      activeStoryPoints: 6,
      issues: [],
      assigned: 5,
      completed: 2,
      overdue: 1,
      openIssues: 3,
      storyPointsAssigned: 10,
      storyPointsCompleted: 4,
      completionRate: 40,
      lastActiveDate: "2026-04-07T18:10:00Z",
      issueTypeCounts: {},
    },
    {
      accountId: "account-2",
      displayName: "Bob Student",
      total: 2,
      active: 1,
      toDo: 0,
      inProgress: 1,
      done: 1,
      activeStoryPoints: 2,
      issues: [],
      assigned: 2,
      completed: 1,
      overdue: 0,
      openIssues: 1,
      storyPointsAssigned: 5,
      storyPointsCompleted: 3,
      completionRate: 50,
      lastActiveDate: "2026-04-08T10:10:00Z",
      issueTypeCounts: {},
    },
  ],
  unassigned: { total: 0, active: 0, done: 0 },
  summary: {
    totalIssues: 7,
    activeIssues: 4,
    doneIssues: 3,
    assignedActiveIssues: 4,
    unassignedActiveIssues: 0,
  },
  sync: {
    status: "SYNCED",
    lastSyncedAt: "2026-04-08T10:10:00Z",
    lastSyncError: null,
  },
  unassignedCount: 0,
  dueDateAvailable: true,
  imbalanceDetected: true,
  imbalanceMessage:
    "Alice Supervisor has 3x more open issues than Bob Student.",
};

const workloadB: JiraWorkload = {
  ...workloadA,
  members: [],
  unassignedCount: 2,
  imbalanceDetected: false,
  imbalanceMessage: null,
};

describe("useJiraWorkload", () => {
  it("loads Jira workload on mount when projectId is provided", async () => {
    const fetcher = vi.fn().mockResolvedValue(workloadA);

    const { result } = renderHook(() => useJiraWorkload(fetcher, "project-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetcher).toHaveBeenCalledWith("project-1");
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
    expect(result.current.workload).toEqual(workloadA);
  });

  it("does not call fetcher when projectId is empty", async () => {
    const fetcher = vi.fn().mockResolvedValue(workloadA);

    const { result } = renderHook(() => useJiraWorkload(fetcher, ""));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    expect(fetcher).not.toHaveBeenCalled();
    expect(result.current.workload).toBeNull();
  });

  it("maps unexpected errors to INTERNAL_ERROR", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useJiraWorkload(fetcher, "project-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.workload).toBeNull();
    expect(result.current.error?.code).toBe("INTERNAL_ERROR");
    expect(result.current.error?.message).toBe(
      "Unable to load Jira team workload data right now.",
    );
  });

  it("supports applyWorkload for immediate UI updates", async () => {
    const fetcher = vi.fn().mockResolvedValue(workloadA);

    const { result } = renderHook(() => useJiraWorkload(fetcher, "project-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.applyWorkload(workloadB);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.workload).toEqual(workloadB);
  });

  it("reload fetches workload again and updates state", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(workloadA)
      .mockResolvedValueOnce(workloadB);

    const { result } = renderHook(() => useJiraWorkload(fetcher, "project-1"));

    await waitFor(() => {
      expect(result.current.workload).toEqual(workloadA);
    });

    await act(async () => {
      await result.current.reload();
    });

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result.current.workload).toEqual(workloadB);
    expect(result.current.error).toBeNull();
  });
});
