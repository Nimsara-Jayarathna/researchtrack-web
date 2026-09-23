type ApiClient = typeof import("@/services/apiClient").apiClient;
import { toVersionedApiPath } from "@/app/config/apiVersion";
import {
  appendQuery,
  clearRecord,
  deleteKeysWithPrefix,
} from "@/services/apiCacheUtils";
import {
  buildPagedUrl,
  fallbackSlicePage,
  normalizePaginatedPayload,
  shouldFallbackToDashboard,
} from "@/features/projects/api/githubPagination";
import type {
  PaginatedListResult,
  ProjectGitHubContributor,
  ProjectGitHubPreview,
  ProjectGitHubRecentCommit,
  ProjectGitHubPullRequest,
  ProjectGitHubPullRequestPageOptions,
} from "@/features/projects/types";
import type { GitHubSyncState } from "@/features/shared/types/github.types";
import type {
  JiraHealth,
  JiraHierarchy,
  JiraIssueList,
  JiraSprintProgress,
  JiraWorkload,
  JiraProjectSyncState,
} from "@/features/shared/types/jira.types";
import type {
  MeetingChannel,
  MeetingChannelUpsertPayload,
  MeetingRecord,
  MeetingRecordUpsertPayload,
} from "@/features/meetings/types";
import { sortMeetingChannels } from "@/features/meetings/lib/sortMeetingChannels";
import { sortMeetingRecords } from "@/features/meetings/lib/sortMeetingRecords";

type RoleBasePath = "/api/student" | "/api/supervisor";

type ProjectGitHubActivity = ProjectGitHubPreview;

const PROJECT_GITHUB_DASHBOARD_TTL_MS = 60_000;

type JiraCache = {
  health?: JiraHealth;
  sprintProgress?: JiraSprintProgress;
  workload?: JiraWorkload;
  hierarchy?: JiraHierarchy;
};

type CreateRoleProjectApiOptions = {
  apiClient: ApiClient;
  roleBasePath: RoleBasePath;
};

export function createRoleProjectApi({
  apiClient,
  roleBasePath,
}: CreateRoleProjectApiOptions) {
  // Student GitHub evidence is project-scoped read-only data, not a student
  // management API. Supervisors keep their compatibility endpoint while
  // students read through the shared authenticated project contract.
  const githubProjectBasePath =
    roleBasePath === "/api/student"
      ? toVersionedApiPath("/api/projects")
      : `${roleBasePath}/projects`;
  const cachedProjectGitHubByKey: Partial<
    Record<string, { data: ProjectGitHubActivity; fetchedAt: number }>
  > = {};
  const inFlightProjectGitHubRequestsByKey: Partial<
    Record<string, Promise<ProjectGitHubActivity>>
  > = {};
  let projectGitHubCacheGeneration = 0;
  const cachedJiraByProjectId: Partial<Record<string, JiraCache>> = {};
  const cachedMeetingChannelsByProjectId: Partial<
    Record<string, MeetingChannel[]>
  > = {};
  const inFlightMeetingChannelsByProjectId: Partial<
    Record<string, Promise<MeetingChannel[]>>
  > = {};
  const cachedMeetingRecordsByProjectId: Partial<
    Record<string, MeetingRecord[]>
  > = {};
  const inFlightMeetingRecordsByProjectId: Partial<
    Record<string, Promise<MeetingRecord[]>>
  > = {};

  function clearCache(): void {
    projectGitHubCacheGeneration += 1;
    clearRecord(cachedProjectGitHubByKey);
    clearRecord(inFlightProjectGitHubRequestsByKey);
    clearRecord(cachedJiraByProjectId);
    clearRecord(cachedMeetingChannelsByProjectId);
    clearRecord(inFlightMeetingChannelsByProjectId);
    clearRecord(cachedMeetingRecordsByProjectId);
    clearRecord(inFlightMeetingRecordsByProjectId);
  }

  function invalidateProjectGitHubCaches(
    projectId: string | null | undefined,
  ): void {
    if (!projectId) return;
    deleteKeysWithPrefix(cachedProjectGitHubByKey, `${projectId}:`);
    deleteKeysWithPrefix(inFlightProjectGitHubRequestsByKey, `${projectId}:`);
  }

  function invalidateJiraCache(projectId: string | null | undefined): void {
    if (!projectId) return;
    delete cachedJiraByProjectId[projectId];
  }

  function primeJiraHealth(projectId: string, health: JiraHealth): void {
    cachedJiraByProjectId[projectId] = {
      ...cachedJiraByProjectId[projectId],
      health,
    };
  }

  async function getProjectGitHubDashboard(
    projectId: string,
    forceRefresh = false,
    linkedRepositoryId?: string | null,
  ): Promise<ProjectGitHubActivity> {
    const key = `${projectId}:${linkedRepositoryId ?? ""}`;

    const cached = cachedProjectGitHubByKey[key];
    if (
      !forceRefresh &&
      cached &&
      Date.now() - cached.fetchedAt < PROJECT_GITHUB_DASHBOARD_TTL_MS
    ) {
      return cached.data;
    }

    if (inFlightProjectGitHubRequestsByKey[key]) {
      return inFlightProjectGitHubRequestsByKey[
        key
      ] as Promise<ProjectGitHubActivity>;
    }

    const params = new URLSearchParams();
    if (linkedRepositoryId) {
      params.set("linkedRepositoryId", linkedRepositoryId);
    }
    const suffix = params.toString() ? `?${params.toString()}` : "";
    const cacheGeneration = projectGitHubCacheGeneration;
    const request = apiClient.get<ProjectGitHubActivity>(
      `${githubProjectBasePath}/${projectId}/github${suffix}`,
    );
    inFlightProjectGitHubRequestsByKey[key] = request;

    try {
      const dashboard = await request;
      if (cacheGeneration === projectGitHubCacheGeneration) {
        cachedProjectGitHubByKey[key] = {
          data: dashboard,
          fetchedAt: Date.now(),
        };
      }
      return dashboard;
    } finally {
      if (inFlightProjectGitHubRequestsByKey[key] === request) {
        delete inFlightProjectGitHubRequestsByKey[key];
      }
    }
  }

  async function getProjectGitHubActivityPage(
    projectId: string,
    page: number,
    linkedRepositoryId?: string | null,
  ): Promise<PaginatedListResult<ProjectGitHubRecentCommit>> {
    const params = new URLSearchParams();
    if (linkedRepositoryId) {
      params.set("linkedRepositoryId", linkedRepositoryId);
    }
    try {
      const payload = await apiClient.get<unknown>(
        appendQuery(
          buildPagedUrl(
            `${githubProjectBasePath}/${projectId}/github/activity`,
            page,
          ),
          params,
        ),
      );
      return normalizePaginatedPayload<ProjectGitHubRecentCommit>(
        payload,
        page,
      );
    } catch (error) {
      if (!shouldFallbackToDashboard(error)) {
        throw error;
      }

      const dashboard = await getProjectGitHubDashboard(
        projectId,
        false,
        linkedRepositoryId,
      );
      return fallbackSlicePage<ProjectGitHubRecentCommit>(
        dashboard.recentCommitsPreview ?? [],
        page,
      );
    }
  }

  async function getProjectGitHubContributorsPage(
    projectId: string,
    page: number,
    linkedRepositoryId?: string | null,
  ): Promise<PaginatedListResult<ProjectGitHubContributor>> {
    const params = new URLSearchParams();
    if (linkedRepositoryId) {
      params.set("linkedRepositoryId", linkedRepositoryId);
    }
    try {
      const payload = await apiClient.get<unknown>(
        appendQuery(
          buildPagedUrl(
            `${githubProjectBasePath}/${projectId}/github/contributors`,
            page,
          ),
          params,
        ),
      );
      return normalizePaginatedPayload<ProjectGitHubContributor>(payload, page);
    } catch (error) {
      if (!shouldFallbackToDashboard(error)) {
        throw error;
      }

      const dashboard = await getProjectGitHubDashboard(
        projectId,
        false,
        linkedRepositoryId,
      );
      return fallbackSlicePage<ProjectGitHubContributor>(
        dashboard.contributorsPreview ?? [],
        page,
      );
    }
  }

  async function getProjectGitHubPullRequestsPage(
    projectId: string,
    page: number,
    linkedRepositoryId: string | null | undefined,
    options: ProjectGitHubPullRequestPageOptions = {},
  ): Promise<PaginatedListResult<ProjectGitHubPullRequest>> {
    if (!linkedRepositoryId) {
      return {
        items: [],
        hasMore: false,
        page,
        size: options.size ?? 10,
        total: 0,
      };
    }

    const params = new URLSearchParams();
    const status = options.status ?? "all";
    if (status !== "all") {
      params.set("status", status);
    }
    const search = options.search?.trim();
    if (search) {
      params.set("search", search);
    }

    const payload = await apiClient.get<unknown>(
      appendQuery(
        buildPagedUrl(
          `${githubProjectBasePath}/${projectId}/github/repositories/${linkedRepositoryId}/pull-requests`,
          page,
          options.size ?? 10,
        ),
        params,
      ),
    );

    return normalizePaginatedPayload<ProjectGitHubPullRequest>(
      payload,
      page,
      options.size ?? 10,
    );
  }

  async function getJiraIssues(projectId: string): Promise<JiraIssueList> {
    return apiClient.get<JiraIssueList>(
      `/api/v1/projects/${projectId}/jira/issues`,
    );
  }

  async function getJiraHealth(projectId: string): Promise<JiraHealth> {
    const hit = cachedJiraByProjectId[projectId]?.health;
    if (hit) return hit;
    const data = await apiClient.get<JiraHealth>(
      `/api/v1/projects/${projectId}/jira/health`,
    );
    cachedJiraByProjectId[projectId] = {
      ...cachedJiraByProjectId[projectId],
      health: data,
    };
    return data;
  }

  async function getJiraSprintProgress(
    projectId: string,
  ): Promise<JiraSprintProgress> {
    // Sprint progress is a small derived local-data view. Read it fresh whenever
    // the section is opened so a completed Jira synchronization is reflected
    // immediately instead of being hidden behind a stale client cache.
    return apiClient.get<JiraSprintProgress>(
      `/api/v1/projects/${projectId}/jira/sprint-progress`,
    );
  }

  async function getJiraWorkload(projectId: string): Promise<JiraWorkload> {
    // Workload is derived from the synchronized Jira issue mirror. Read it fresh
    // so a completed supervisor refresh is immediately visible to both roles.
    return apiClient.get<JiraWorkload>(
      `/api/v1/projects/${projectId}/jira/workload`,
    );
  }

  async function getProjectJiraHierarchy(
    projectId: string,
  ): Promise<JiraHierarchy> {
    const hit = cachedJiraByProjectId[projectId]?.hierarchy;
    if (hit) return hit;
    const data = await apiClient.get<JiraHierarchy>(
      `${roleBasePath}/projects/${projectId}/jira/hierarchy`,
    );
    cachedJiraByProjectId[projectId] = {
      ...cachedJiraByProjectId[projectId],
      hierarchy: data,
    };
    return data;
  }


  async function getProjectGitHubSyncState(
    projectId: string,
  ): Promise<GitHubSyncState> {
    return apiClient.get<GitHubSyncState>(
      `${toVersionedApiPath("/api/projects")}/${projectId}/github/sync-state`,
    );
  }

  async function getProjectJiraSyncState(
    projectId: string,
  ): Promise<JiraProjectSyncState> {
    return apiClient.get<JiraProjectSyncState>(
      `/api/v1/projects/${projectId}/jira/sync-state`,
    );
  }

  async function getProjectMeetingChannels(
    projectId: string,
    forceRefresh = false,
  ): Promise<MeetingChannel[]> {
    if (!forceRefresh && cachedMeetingChannelsByProjectId[projectId]) {
      return cachedMeetingChannelsByProjectId[projectId] as MeetingChannel[];
    }

    if (!forceRefresh && inFlightMeetingChannelsByProjectId[projectId]) {
      return inFlightMeetingChannelsByProjectId[projectId] as Promise<
        MeetingChannel[]
      >;
    }

    if (forceRefresh) {
      delete cachedMeetingChannelsByProjectId[projectId];
    }

    const request = apiClient.get<MeetingChannel[]>(
      `${roleBasePath}/projects/${projectId}/meeting-channels`,
    );
    inFlightMeetingChannelsByProjectId[projectId] = request;

    try {
      const channels = await request;
      cachedMeetingChannelsByProjectId[projectId] = channels;
      return channels;
    } finally {
      delete inFlightMeetingChannelsByProjectId[projectId];
    }
  }

  async function createProjectMeetingChannel(
    projectId: string,
    payload: MeetingChannelUpsertPayload,
  ): Promise<MeetingChannel> {
    const created = await apiClient.post<MeetingChannel>(
      `${roleBasePath}/projects/${projectId}/meeting-channels`,
      payload,
    );
    delete inFlightMeetingChannelsByProjectId[projectId];
    const existing = cachedMeetingChannelsByProjectId[projectId];
    if (existing) {
      cachedMeetingChannelsByProjectId[projectId] = sortMeetingChannels([
        created,
        ...existing.filter((item) => item.id !== created.id),
      ]);
    }
    return created;
  }

  async function updateProjectMeetingChannel(
    projectId: string,
    channelId: string,
    payload: MeetingChannelUpsertPayload,
  ): Promise<MeetingChannel> {
    const updated = await apiClient.patch<MeetingChannel>(
      `${roleBasePath}/projects/${projectId}/meeting-channels/${channelId}`,
      payload,
    );
    delete inFlightMeetingChannelsByProjectId[projectId];
    const existing = cachedMeetingChannelsByProjectId[projectId];
    if (existing) {
      cachedMeetingChannelsByProjectId[projectId] = sortMeetingChannels(
        existing.map((item) => (item.id === updated.id ? updated : item)),
      );
    }
    return updated;
  }

  async function deleteProjectMeetingChannel(
    projectId: string,
    channelId: string,
  ): Promise<void> {
    await apiClient.del<void>(
      `${roleBasePath}/projects/${projectId}/meeting-channels/${channelId}`,
    );
    delete inFlightMeetingChannelsByProjectId[projectId];
    const existing = cachedMeetingChannelsByProjectId[projectId];
    if (existing) {
      cachedMeetingChannelsByProjectId[projectId] = existing.filter(
        (item) => item.id !== channelId,
      );
    }
  }

  async function approveProjectMeetingChannel(
    projectId: string,
    channelId: string,
  ): Promise<MeetingChannel> {
    const approved = await apiClient.post<MeetingChannel>(
      `${roleBasePath}/projects/${projectId}/meeting-channels/${channelId}/approve`,
      {},
    );
    delete inFlightMeetingChannelsByProjectId[projectId];
    const existing = cachedMeetingChannelsByProjectId[projectId];
    if (existing) {
      cachedMeetingChannelsByProjectId[projectId] = sortMeetingChannels(
        existing.map((item) => (item.id === approved.id ? approved : item)),
      );
    }
    return approved;
  }

  async function getProjectMeetingRecords(
    projectId: string,
    forceRefresh = false,
  ): Promise<MeetingRecord[]> {
    if (!forceRefresh && cachedMeetingRecordsByProjectId[projectId]) {
      return cachedMeetingRecordsByProjectId[projectId] as MeetingRecord[];
    }

    if (!forceRefresh && inFlightMeetingRecordsByProjectId[projectId]) {
      return inFlightMeetingRecordsByProjectId[projectId] as Promise<
        MeetingRecord[]
      >;
    }

    if (forceRefresh) {
      delete cachedMeetingRecordsByProjectId[projectId];
    }

    const request = apiClient.get<MeetingRecord[]>(
      `${roleBasePath}/projects/${projectId}/meeting-records`,
    );
    inFlightMeetingRecordsByProjectId[projectId] = request;

    try {
      const records = sortMeetingRecords(await request);
      cachedMeetingRecordsByProjectId[projectId] = records;
      return records;
    } finally {
      delete inFlightMeetingRecordsByProjectId[projectId];
    }
  }

  async function createProjectMeetingRecord(
    projectId: string,
    payload: MeetingRecordUpsertPayload,
  ): Promise<MeetingRecord> {
    const created = await apiClient.post<MeetingRecord>(
      `${roleBasePath}/projects/${projectId}/meeting-records`,
      payload,
    );
    delete inFlightMeetingRecordsByProjectId[projectId];
    const existing = cachedMeetingRecordsByProjectId[projectId];
    if (existing) {
      cachedMeetingRecordsByProjectId[projectId] = sortMeetingRecords([
        created,
        ...existing.filter((item) => item.id !== created.id),
      ]);
    }
    return created;
  }

  async function updateProjectMeetingRecord(
    projectId: string,
    recordId: string,
    payload: MeetingRecordUpsertPayload,
  ): Promise<MeetingRecord> {
    const updated = await apiClient.patch<MeetingRecord>(
      `${roleBasePath}/projects/${projectId}/meeting-records/${recordId}`,
      payload,
    );
    delete inFlightMeetingRecordsByProjectId[projectId];
    const existing = cachedMeetingRecordsByProjectId[projectId];
    if (existing) {
      cachedMeetingRecordsByProjectId[projectId] = sortMeetingRecords(
        existing.map((item) => (item.id === updated.id ? updated : item)),
      );
    }
    return updated;
  }

  async function deleteProjectMeetingRecord(
    projectId: string,
    recordId: string,
  ): Promise<void> {
    await apiClient.del<void>(
      `${roleBasePath}/projects/${projectId}/meeting-records/${recordId}`,
    );
    delete inFlightMeetingRecordsByProjectId[projectId];
    const existing = cachedMeetingRecordsByProjectId[projectId];
    if (existing) {
      cachedMeetingRecordsByProjectId[projectId] = existing.filter(
        (item) => item.id !== recordId,
      );
    }
  }

  async function approveProjectMeetingRecord(
    projectId: string,
    recordId: string,
  ): Promise<MeetingRecord> {
    const approved = await apiClient.post<MeetingRecord>(
      `${roleBasePath}/projects/${projectId}/meeting-records/${recordId}/approve`,
      {},
    );
    delete inFlightMeetingRecordsByProjectId[projectId];
    const existing = cachedMeetingRecordsByProjectId[projectId];
    if (existing) {
      cachedMeetingRecordsByProjectId[projectId] = sortMeetingRecords(
        existing.map((item) => (item.id === approved.id ? approved : item)),
      );
    }
    return approved;
  }

  return {
    clearCache,
    invalidateJiraCache,
    invalidateProjectGitHubCaches,
    primeJiraHealth,
    getProjectGitHubDashboard,
    getProjectGitHubSyncState,
    getProjectGitHubActivityPage,
    getProjectGitHubContributorsPage,
    getProjectGitHubPullRequestsPage,
    getJiraIssues,
    getJiraHealth,
    getJiraSprintProgress,
    getJiraWorkload,
    getProjectJiraHierarchy,
    getProjectJiraSyncState,
    getProjectMeetingChannels,
    createProjectMeetingChannel,
    updateProjectMeetingChannel,
    deleteProjectMeetingChannel,
    approveProjectMeetingChannel,
    getProjectMeetingRecords,
    createProjectMeetingRecord,
    updateProjectMeetingRecord,
    deleteProjectMeetingRecord,
    approveProjectMeetingRecord,
  };
}
