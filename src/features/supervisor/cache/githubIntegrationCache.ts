import type {
  GitHubAvailableRepositories,
  ProjectGitHubRepositories,
} from "../types";

export const PROJECT_GITHUB_REPOSITORIES_TTL_MS = 45_000;
export const AVAILABLE_GITHUB_REPOSITORIES_TTL_MS = 20_000;

type TimedEntry<T> = {
  data: T;
  fetchedAt: number;
};

type CacheSnapshot<T> = TimedEntry<T> & {
  isFresh: boolean;
};

type Listener<T> = (data: T | null) => void;

const projectEntries: Partial<
  Record<string, TimedEntry<ProjectGitHubRepositories>>
> = {};
const projectRequests: Partial<
  Record<string, Promise<ProjectGitHubRepositories>>
> = {};
const projectListeners: Partial<
  Record<string, Set<Listener<ProjectGitHubRepositories>>>
> = {};

const availableEntries: Partial<
  Record<string, TimedEntry<GitHubAvailableRepositories>>
> = {};
const availableRequests: Partial<
  Record<string, Promise<GitHubAvailableRepositories>>
> = {};
const availableListeners: Partial<
  Record<string, Set<Listener<GitHubAvailableRepositories>>>
> = {};

let cacheGeneration = 0;

export function getGitHubIntegrationCacheGeneration() {
  return cacheGeneration;
}

function snapshot<T>(
  entry: TimedEntry<T> | undefined,
  ttlMs: number,
  now = Date.now(),
): CacheSnapshot<T> | null {
  if (!entry) return null;
  return {
    ...entry,
    isFresh: now - entry.fetchedAt < ttlMs,
  };
}

function notify<T>(
  listeners: Partial<Record<string, Set<Listener<T>>>>,
  key: string,
  data: T | null,
) {
  for (const listener of listeners[key] ?? []) {
    listener(data);
  }
}

export function getProjectGitHubRepositoriesCacheSnapshot(
  projectId: string,
  now = Date.now(),
): CacheSnapshot<ProjectGitHubRepositories> | null {
  return snapshot(
    projectEntries[projectId],
    PROJECT_GITHUB_REPOSITORIES_TTL_MS,
    now,
  );
}

export function setProjectGitHubRepositoriesCache(
  data: ProjectGitHubRepositories,
  fetchedAt = Date.now(),
  expectedGeneration?: number,
) {
  if (
    expectedGeneration !== undefined &&
    expectedGeneration !== cacheGeneration
  ) {
    return;
  }
  projectEntries[data.projectId] = { data, fetchedAt };
  notify(projectListeners, data.projectId, data);
}

export function updateProjectGitHubRepositoriesCache(
  projectId: string,
  updater: (current: ProjectGitHubRepositories) => ProjectGitHubRepositories,
): ProjectGitHubRepositories | null {
  const current = projectEntries[projectId];
  if (!current) return null;
  const data = updater(current.data);
  projectEntries[projectId] = {
    data,
    // A local mutation is authoritative for the fields it changes, but keep the
    // previous fetch age so unrelated server state is still revalidated on time.
    fetchedAt: current.fetchedAt,
  };
  notify(projectListeners, projectId, data);
  return data;
}

export function invalidateProjectGitHubRepositoriesCache(
  projectId: string,
  expectedGeneration?: number,
) {
  if (
    expectedGeneration !== undefined &&
    expectedGeneration !== cacheGeneration
  ) {
    return;
  }
  delete projectEntries[projectId];
}

export function getProjectGitHubRepositoriesInFlight(projectId: string) {
  return projectRequests[projectId] ?? null;
}

export function setProjectGitHubRepositoriesInFlight(
  projectId: string,
  request: Promise<ProjectGitHubRepositories>,
) {
  projectRequests[projectId] = request;
}

export function clearProjectGitHubRepositoriesInFlight(
  projectId: string,
  request: Promise<ProjectGitHubRepositories>,
) {
  if (projectRequests[projectId] === request) {
    delete projectRequests[projectId];
  }
}

export function subscribeProjectGitHubRepositories(
  projectId: string,
  listener: Listener<ProjectGitHubRepositories>,
) {
  const listeners =
    projectListeners[projectId] ??
    (projectListeners[projectId] = new Set<
      Listener<ProjectGitHubRepositories>
    >());
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) delete projectListeners[projectId];
  };
}

export function getAvailableGitHubRepositoriesCacheSnapshot(
  sourceId: string,
  now = Date.now(),
): CacheSnapshot<GitHubAvailableRepositories> | null {
  return snapshot(
    availableEntries[sourceId],
    AVAILABLE_GITHUB_REPOSITORIES_TTL_MS,
    now,
  );
}

export function setAvailableGitHubRepositoriesCache(
  data: GitHubAvailableRepositories,
  fetchedAt = Date.now(),
  expectedGeneration?: number,
) {
  if (
    expectedGeneration !== undefined &&
    expectedGeneration !== cacheGeneration
  ) {
    return;
  }
  availableEntries[data.sourceId] = { data, fetchedAt };
  notify(availableListeners, data.sourceId, data);
}

export function invalidateAvailableGitHubRepositoriesCache(
  sourceId: string,
  expectedGeneration?: number,
) {
  if (
    expectedGeneration !== undefined &&
    expectedGeneration !== cacheGeneration
  ) {
    return;
  }
  delete availableEntries[sourceId];
}

export function invalidateAllAvailableGitHubRepositoriesCache() {
  for (const key of Object.keys(availableEntries)) delete availableEntries[key];
  for (const key of Object.keys(availableRequests))
    delete availableRequests[key];
}

export function getAvailableGitHubRepositoriesInFlight(sourceId: string) {
  return availableRequests[sourceId] ?? null;
}

export function setAvailableGitHubRepositoriesInFlight(
  sourceId: string,
  request: Promise<GitHubAvailableRepositories>,
) {
  availableRequests[sourceId] = request;
}

export function clearAvailableGitHubRepositoriesInFlight(
  sourceId: string,
  request: Promise<GitHubAvailableRepositories>,
) {
  if (availableRequests[sourceId] === request) {
    delete availableRequests[sourceId];
  }
}

export function subscribeAvailableGitHubRepositories(
  sourceId: string,
  listener: Listener<GitHubAvailableRepositories>,
) {
  const listeners =
    availableListeners[sourceId] ??
    (availableListeners[sourceId] = new Set<
      Listener<GitHubAvailableRepositories>
    >());
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) delete availableListeners[sourceId];
  };
}

export function clearGitHubIntegrationCache() {
  cacheGeneration += 1;
  for (const key of Object.keys(projectEntries)) {
    delete projectEntries[key];
    notify(projectListeners, key, null);
  }
  for (const key of Object.keys(projectRequests)) delete projectRequests[key];
  for (const key of Object.keys(availableEntries)) {
    delete availableEntries[key];
    notify(availableListeners, key, null);
  }
  for (const key of Object.keys(availableRequests))
    delete availableRequests[key];
}
