import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MeetingChannel, MeetingRecord } from "@/features/meetings/types";

const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("@/services/apiClient", () => ({
  apiClient: apiClientMock,
}));

async function loadStudentApi() {
  const module = await import("./studentApi");
  return module.studentApi;
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
    discussionDetails: null,
    channelId: null,
    addedBy: "u-1",
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

describe("studentApi meeting-channels cache", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("does not expose Supervisor-only meeting management mutations", async () => {
    const studentApi = await loadStudentApi();

    expect("updateProjectMeetingChannel" in studentApi).toBe(false);
    expect("deleteProjectMeetingChannel" in studentApi).toBe(false);
    expect("approveProjectMeetingChannel" in studentApi).toBe(false);
    expect("updateProjectMeetingRecord" in studentApi).toBe(false);
    expect("deleteProjectMeetingRecord" in studentApi).toBe(false);
    expect("approveProjectMeetingRecord" in studentApi).toBe(false);
  });

  it("deduplicates concurrent meeting-channels requests", async () => {
    const studentApi = await loadStudentApi();
    let resolveGet: ((value: unknown) => void) | null = null;

    vi.mocked(apiClientMock.get).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveGet = resolve;
        }),
    );

    const first = studentApi.getProjectMeetingChannels("p-1");
    const second = studentApi.getProjectMeetingChannels("p-1");

    expect(apiClientMock.get).toHaveBeenCalledTimes(1);
    expect(apiClientMock.get).toHaveBeenCalledWith(
      "/api/v1/projects/p-1/meetings/channels",
    );
    resolveGet?.([channel()]);

    await expect(first).resolves.toEqual([channel()]);
    await expect(second).resolves.toEqual([channel()]);
  });

  it("serves cached meeting-channels responses until forced refresh", async () => {
    const studentApi = await loadStudentApi();
    vi.mocked(apiClientMock.get).mockResolvedValue([channel()]);

    await expect(studentApi.getProjectMeetingChannels("p-1")).resolves.toEqual([
      channel(),
    ]);
    await expect(studentApi.getProjectMeetingChannels("p-1")).resolves.toEqual([
      channel(),
    ]);
    expect(apiClientMock.get).toHaveBeenCalledTimes(1);

    vi.mocked(apiClientMock.get).mockResolvedValue([channel({ id: "c-2" })]);
    await expect(
      studentApi.getProjectMeetingChannels("p-1", true),
    ).resolves.toEqual([channel({ id: "c-2" })]);
    expect(apiClientMock.get).toHaveBeenCalledTimes(2);
  });

  it("patches the cache when creating meeting channels", async () => {
    const studentApi = await loadStudentApi();
    vi.mocked(apiClientMock.get).mockResolvedValue([channel()]);
    await studentApi.getProjectMeetingChannels("p-1");

    const created = channel({
      id: "c-2",
      createdAt: "2026-04-17T00:00:00.000Z",
    });
    vi.mocked(apiClientMock.post).mockResolvedValue(created);

    await studentApi.createProjectMeetingChannel("p-1", {
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
    const next = await studentApi.getProjectMeetingChannels("p-1");
    expect(apiClientMock.get).not.toHaveBeenCalled();
    expect(next.map((item) => item.id)).toEqual(["c-2", "c-1"]);
  });
});

describe("studentApi meeting-records shared endpoint", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("uses the canonical MeetingService route for student history reads and submissions", async () => {
    const studentApi = await loadStudentApi();
    vi.mocked(apiClientMock.get).mockResolvedValue([record()]);

    await expect(studentApi.getProjectMeetingRecords("p-1")).resolves.toEqual([
      record(),
    ]);
    expect(apiClientMock.get).toHaveBeenCalledWith(
      "/api/v1/projects/p-1/meetings/records",
    );

    const payload = {
      meetingDate: "2026-10-02",
      durationMinutes: 45,
      discussionSummary: "Discussed methodology",
      discussionDetails: null,
      channelId: null,
    };
    vi.mocked(apiClientMock.post).mockResolvedValue(record());

    await studentApi.createProjectMeetingRecord("p-1", payload);
    expect(apiClientMock.post).toHaveBeenCalledWith(
      "/api/v1/projects/p-1/meetings/records",
      payload,
    );
  });

  it("deduplicates and caches concurrent Student meeting-history reads", async () => {
    const studentApi = await loadStudentApi();
    let resolveGet: ((value: unknown) => void) | null = null;

    vi.mocked(apiClientMock.get).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveGet = resolve;
        }),
    );

    const first = studentApi.getProjectMeetingRecords("p-1");
    const second = studentApi.getProjectMeetingRecords("p-1");

    expect(apiClientMock.get).toHaveBeenCalledTimes(1);
    expect(apiClientMock.get).toHaveBeenCalledWith(
      "/api/v1/projects/p-1/meetings/records",
    );

    resolveGet?.([record()]);
    await expect(first).resolves.toEqual([record()]);
    await expect(second).resolves.toEqual([record()]);

    vi.mocked(apiClientMock.get).mockClear();
    await expect(studentApi.getProjectMeetingRecords("p-1")).resolves.toEqual([
      record(),
    ]);
    expect(apiClientMock.get).not.toHaveBeenCalled();
  });

  it("patches Student meeting-history cache after a pending submission", async () => {
    const studentApi = await loadStudentApi();
    const existing = record({
      id: "r-old",
      status: "APPROVED",
      meetingDate: "2026-10-01",
    });
    vi.mocked(apiClientMock.get).mockResolvedValue([existing]);
    await studentApi.getProjectMeetingRecords("p-1");

    const created = record({ id: "r-new", status: "PENDING" });
    vi.mocked(apiClientMock.post).mockResolvedValue(created);
    await studentApi.createProjectMeetingRecord("p-1", {
      meetingDate: "2026-10-02",
      durationMinutes: 45,
      discussionSummary: "Discussed methodology",
      discussionDetails: null,
      channelId: null,
    });

    vi.mocked(apiClientMock.get).mockClear();
    const next = await studentApi.getProjectMeetingRecords("p-1");
    expect(apiClientMock.get).not.toHaveBeenCalled();
    expect(next.map((item) => item.id)).toEqual(["r-new", "r-old"]);
    expect(next[0]?.status).toBe("PENDING");
  });
});
