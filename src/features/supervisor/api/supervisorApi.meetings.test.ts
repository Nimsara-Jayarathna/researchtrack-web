import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MeetingChannel, MeetingRecord } from "@/features/meetings/types";

const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    del: vi.fn(),
  },
}));

vi.mock("@/services/apiClient", () => ({
  apiClient: apiClientMock,
}));

async function loadSupervisorApi() {
  const module = await import("./supervisorApi");
  return module.supervisorApi;
}

function channel(overrides: Partial<MeetingChannel> = {}): MeetingChannel {
  return {
    id: "c-1",
    projectId: "p-1",
    platform: "ZOOM",
    channelName: "Weekly sync",
    linkOrIdentifier: "https://example.com",
    addedBy: "u-1",
    addedByName: "Student",
    addedByRole: "STUDENT",
    status: "PENDING",
    approvedBy: null,
    approvedByName: null,
    approvedAt: null,
    createdAt: "2026-04-16T00:00:00.000Z",
    updatedAt: null,
    ...overrides,
  };
}

function record(overrides: Partial<MeetingRecord> = {}): MeetingRecord {
  return {
    id: "r-1",
    projectId: "p-1",
    meetingDate: "2026-10-02",
    durationMinutes: 45,
    discussionSummary: "Discussed methodology",
    discussionDetails: "Detailed notes",
    channelId: "c-1",
    addedBy: "u-2",
    addedByName: "Student",
    addedByRole: "STUDENT",
    status: "PENDING",
    approvedBy: null,
    approvedByName: null,
    approvedAt: null,
    createdAt: "2026-10-02T10:00:00.000Z",
    updatedAt: null,
    ...overrides,
  };
}

describe("supervisorApi meeting-channels cache", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("deduplicates concurrent meeting-channels requests", async () => {
    const supervisorApi = await loadSupervisorApi();
    let resolveGet: ((value: unknown) => void) | null = null;

    vi.mocked(apiClientMock.get).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveGet = resolve;
        }),
    );

    const first = supervisorApi.getProjectMeetingChannels("p-1");
    const second = supervisorApi.getProjectMeetingChannels("p-1");

    expect(apiClientMock.get).toHaveBeenCalledTimes(1);
    expect(apiClientMock.get).toHaveBeenCalledWith(
      "/api/v1/projects/p-1/meetings/channels",
    );
    resolveGet?.([channel()]);

    await expect(first).resolves.toEqual([channel()]);
    await expect(second).resolves.toEqual([channel()]);
  });

  it("serves cached meeting-channels responses until forced refresh", async () => {
    const supervisorApi = await loadSupervisorApi();
    vi.mocked(apiClientMock.get).mockResolvedValue([channel()]);

    await expect(
      supervisorApi.getProjectMeetingChannels("p-1"),
    ).resolves.toEqual([channel()]);
    await expect(
      supervisorApi.getProjectMeetingChannels("p-1"),
    ).resolves.toEqual([channel()]);
    expect(apiClientMock.get).toHaveBeenCalledTimes(1);

    vi.mocked(apiClientMock.get).mockResolvedValue([channel({ id: "c-2" })]);
    await expect(
      supervisorApi.getProjectMeetingChannels("p-1", true),
    ).resolves.toEqual([channel({ id: "c-2" })]);
    expect(apiClientMock.get).toHaveBeenCalledTimes(2);
  });

  it("patches the cache when creating meeting channels", async () => {
    const supervisorApi = await loadSupervisorApi();
    vi.mocked(apiClientMock.get).mockResolvedValue([channel()]);
    await supervisorApi.getProjectMeetingChannels("p-1");

    const created = channel({
      id: "c-2",
      status: "APPROVED",
      createdAt: "2026-04-17T00:00:00.000Z",
      approvedBy: "u-2",
      approvedByName: "Supervisor",
      approvedAt: "2026-04-17T00:00:00.000Z",
      addedByRole: "SUPERVISOR",
      addedByName: "Supervisor",
    });

    vi.mocked(apiClientMock.post).mockResolvedValue(created);
    await supervisorApi.createProjectMeetingChannel("p-1", {
      platform: "ZOOM",
      channelName: "Weekly sync",
      linkOrIdentifier: "https://example.com",
    });

    expect(apiClientMock.post).toHaveBeenCalledWith(
      "/api/v1/projects/p-1/meetings/channels",
      {
        platform: "ZOOM",
        channelName: "Weekly sync",
        linkOrIdentifier: "https://example.com",
      },
    );

    vi.mocked(apiClientMock.get).mockClear();
    const next = await supervisorApi.getProjectMeetingChannels("p-1");
    expect(apiClientMock.get).not.toHaveBeenCalled();
    expect(next.map((item) => item.id)).toEqual(["c-1", "c-2"]); // pending first
  });

  it("invalidates cached meeting history when a linked channel is deleted", async () => {
    const supervisorApi = await loadSupervisorApi();
    vi.mocked(apiClientMock.get).mockResolvedValueOnce([record()]);
    await supervisorApi.getProjectMeetingRecords("p-1");

    vi.mocked(apiClientMock.del).mockResolvedValue(undefined);
    await supervisorApi.deleteProjectMeetingChannel("p-1", "c-1");

    vi.mocked(apiClientMock.get).mockResolvedValueOnce([
      record({ channelId: null }),
    ]);
    const refreshed = await supervisorApi.getProjectMeetingRecords("p-1");

    expect(apiClientMock.get).toHaveBeenCalledTimes(2);
    expect(refreshed[0]?.channelId).toBeNull();
  });

  it("uses the canonical MeetingService paths for supervisor mutations", async () => {
    const supervisorApi = await loadSupervisorApi();
    const updated = channel({ id: "c-7", status: "APPROVED" });
    vi.mocked(apiClientMock.patch).mockResolvedValue(updated);
    vi.mocked(apiClientMock.del).mockResolvedValue(undefined);
    vi.mocked(apiClientMock.post).mockResolvedValue(updated);

    const payload = {
      channelName: "Updated",
      linkOrIdentifier: "https://example.com/updated",
    };

    await supervisorApi.updateProjectMeetingChannel("p-1", "c-7", payload);
    expect(apiClientMock.patch).toHaveBeenCalledWith(
      "/api/v1/projects/p-1/meetings/channels/c-7",
      payload,
    );

    await supervisorApi.deleteProjectMeetingChannel("p-1", "c-7");
    expect(apiClientMock.del).toHaveBeenCalledWith(
      "/api/v1/projects/p-1/meetings/channels/c-7",
    );

    await supervisorApi.approveProjectMeetingChannel("p-1", "c-7");
    expect(apiClientMock.post).toHaveBeenLastCalledWith(
      "/api/v1/projects/p-1/meetings/channels/c-7/approve",
      {},
    );
  });
});

describe("supervisorApi meeting-records cache", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("deduplicates and caches canonical MeetingService record reads", async () => {
    const supervisorApi = await loadSupervisorApi();
    let resolveGet: ((value: unknown) => void) | null = null;

    vi.mocked(apiClientMock.get).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveGet = resolve;
        }),
    );

    const first = supervisorApi.getProjectMeetingRecords("p-1");
    const second = supervisorApi.getProjectMeetingRecords("p-1");

    expect(apiClientMock.get).toHaveBeenCalledTimes(1);
    expect(apiClientMock.get).toHaveBeenCalledWith(
      "/api/v1/projects/p-1/meetings/records",
    );
    resolveGet?.([record()]);

    await expect(first).resolves.toEqual([record()]);
    await expect(second).resolves.toEqual([record()]);

    vi.mocked(apiClientMock.get).mockClear();
    await expect(
      supervisorApi.getProjectMeetingRecords("p-1"),
    ).resolves.toEqual([record()]);
    expect(apiClientMock.get).not.toHaveBeenCalled();
  });

  it("uses canonical MeetingService paths for record create update delete and approve", async () => {
    const supervisorApi = await loadSupervisorApi();
    const payload = {
      meetingDate: "2026-10-02",
      durationMinutes: 45,
      discussionSummary: "Discussed methodology",
      discussionDetails: "Detailed notes",
      channelId: "c-1",
    };
    const created = record({ id: "r-7", status: "APPROVED" });
    vi.mocked(apiClientMock.post).mockResolvedValue(created);
    vi.mocked(apiClientMock.patch).mockResolvedValue(created);
    vi.mocked(apiClientMock.del).mockResolvedValue(undefined);

    await supervisorApi.createProjectMeetingRecord("p-1", payload);
    expect(apiClientMock.post).toHaveBeenCalledWith(
      "/api/v1/projects/p-1/meetings/records",
      payload,
    );

    await supervisorApi.updateProjectMeetingRecord("p-1", "r-7", payload);
    expect(apiClientMock.patch).toHaveBeenCalledWith(
      "/api/v1/projects/p-1/meetings/records/r-7",
      payload,
    );

    await supervisorApi.deleteProjectMeetingRecord("p-1", "r-7");
    expect(apiClientMock.del).toHaveBeenCalledWith(
      "/api/v1/projects/p-1/meetings/records/r-7",
    );

    await supervisorApi.approveProjectMeetingRecord("p-1", "r-7");
    expect(apiClientMock.post).toHaveBeenLastCalledWith(
      "/api/v1/projects/p-1/meetings/records/r-7/approve",
      {},
    );
  });

  it("keeps pending records first and then orders meeting history by date", async () => {
    const supervisorApi = await loadSupervisorApi();
    const pending = record({ id: "pending", meetingDate: "2026-09-01" });
    const newestApproved = record({
      id: "approved-new",
      status: "APPROVED",
      meetingDate: "2026-10-03",
    });
    const olderApproved = record({
      id: "approved-old",
      status: "APPROVED",
      meetingDate: "2026-10-01",
    });
    vi.mocked(apiClientMock.get).mockResolvedValue([
      olderApproved,
      newestApproved,
      pending,
    ]);

    const result = await supervisorApi.getProjectMeetingRecords("p-1");
    expect(result.map((item) => item.id)).toEqual([
      "pending",
      "approved-new",
      "approved-old",
    ]);
  });
});
