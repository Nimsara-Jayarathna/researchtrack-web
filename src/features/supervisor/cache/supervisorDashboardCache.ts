import { registerSessionCacheClearer } from "@/services/sessionCache";
import type { SupervisorDashboard } from "../types";

const DASHBOARD_CACHE_TTL_MS = 30_000;

let cachedDashboard: SupervisorDashboard | null = null;
let cachedAt = 0;
let inFlightDashboardRequest: Promise<SupervisorDashboard> | null = null;

export function getCachedSupervisorDashboard(): SupervisorDashboard | null {
  if (!cachedDashboard) return null;
  if (Date.now() - cachedAt > DASHBOARD_CACHE_TTL_MS) {
    cachedDashboard = null;
    cachedAt = 0;
    return null;
  }
  return cachedDashboard;
}

export function setCachedSupervisorDashboard(
  dashboard: SupervisorDashboard | null,
): void {
  cachedDashboard = dashboard;
  cachedAt = dashboard ? Date.now() : 0;
}

export function getInFlightSupervisorDashboardRequest(): Promise<SupervisorDashboard> | null {
  return inFlightDashboardRequest;
}

export function setInFlightSupervisorDashboardRequest(
  request: Promise<SupervisorDashboard> | null,
): void {
  inFlightDashboardRequest = request;
}

export function invalidateSupervisorDashboardCache(): void {
  cachedDashboard = null;
  cachedAt = 0;
  inFlightDashboardRequest = null;
}

registerSessionCacheClearer(invalidateSupervisorDashboardCache);
