import { registerSessionCacheClearer } from "@/services/sessionCache";
import type { SupervisorDashboard } from "../types";

let cachedDashboard: SupervisorDashboard | null = null;
let inFlightDashboardRequest: Promise<SupervisorDashboard> | null = null;

export function getCachedSupervisorDashboard(): SupervisorDashboard | null {
  return cachedDashboard;
}

export function setCachedSupervisorDashboard(
  dashboard: SupervisorDashboard | null,
): void {
  cachedDashboard = dashboard;
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
  inFlightDashboardRequest = null;
}

registerSessionCacheClearer(invalidateSupervisorDashboardCache);
