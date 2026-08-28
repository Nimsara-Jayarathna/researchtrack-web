import { useCallback, useEffect, useRef, useState } from "react";
import { isApiException } from "@/services/apiClient";
import type { ApiError } from "@/types";
import { supervisorApi } from "../api/supervisorApi";
import type { SupervisorDashboard } from "../types";
import {
  getCachedSupervisorDashboard,
  getInFlightSupervisorDashboardRequest,
  invalidateSupervisorDashboardCache,
  setCachedSupervisorDashboard,
  setInFlightSupervisorDashboardRequest,
} from "../cache/supervisorDashboardCache";
import { getSessionVersion, isCurrentSession } from "@/services/sessionState";

type SupervisorDashboardState = {
  dashboard: SupervisorDashboard | null;
  isLoading: boolean;
  error: ApiError | null;
};

const UNKNOWN_ERROR_BASE: ApiError = {
  code: "INTERNAL_ERROR",
  message: "Unable to load dashboard right now.",
  details: [],
  timestamp: new Date().toISOString(),
  status: 0,
  error: "Unexpected Error",
  path: "",
  traceId: null,
};

export { invalidateSupervisorDashboardCache };

export function useSupervisorDashboard() {
  const initialDashboard = getCachedSupervisorDashboard();
  const [state, setState] = useState<SupervisorDashboardState>({
    dashboard: initialDashboard,
    isLoading: initialDashboard ? false : true,
    error: null,
  });

  const latestRequestId = useRef(0);

  const loadDashboard = useCallback(async (forceRefresh = false) => {
    const requestSessionVersion = getSessionVersion();
    const requestId = (latestRequestId.current += 1);

    const normalizeDashboardError = (error: unknown): ApiError => {
      if (isApiException(error)) {
        return error.apiError;
      }

      return {
        ...UNKNOWN_ERROR_BASE,
        timestamp: new Date().toISOString(),
      };
    };

    const applyDashboardSuccess = (dashboard: SupervisorDashboard) => {
      setState({
        dashboard,
        isLoading: false,
        error: null,
      });
    };

    const applyDashboardError = (error: unknown) => {
      setState({
        dashboard: null,
        isLoading: false,
        error: normalizeDashboardError(error),
      });
    };

    const cachedDashboard = getCachedSupervisorDashboard();
    if (!forceRefresh && cachedDashboard) {
      if (!isCurrentSession(requestSessionVersion)) {
        return;
      }

      applyDashboardSuccess(cachedDashboard);
      return;
    }

    const inFlightDashboardRequest = getInFlightSupervisorDashboardRequest();
    const startsNewRequest = forceRefresh || !inFlightDashboardRequest;
    const request = startsNewRequest
      ? supervisorApi.getDashboard()
      : inFlightDashboardRequest;

    if (startsNewRequest) {
      setInFlightSupervisorDashboardRequest(request);
    }

    setState((current) => ({ ...current, isLoading: true, error: null }));

    try {
      const dashboard = await request;
      const shouldCommitCache =
        getInFlightSupervisorDashboardRequest() === request;
      if (shouldCommitCache) {
        setCachedSupervisorDashboard(dashboard);
      }

      if (!isCurrentSession(requestSessionVersion)) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.info("[useSupervisorDashboard] discarded stale response");
        }
        if (latestRequestId.current === requestId) {
          setState((current) => ({ ...current, isLoading: false }));
        }
        return;
      }

      if (latestRequestId.current === requestId) {
        applyDashboardSuccess(dashboard);
      }
    } catch (error) {
      if (!isCurrentSession(requestSessionVersion)) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.info("[useSupervisorDashboard] discarded stale error");
        }
        if (latestRequestId.current === requestId) {
          setState((current) => ({ ...current, isLoading: false }));
        }
        return;
      }

      if (latestRequestId.current === requestId) {
        applyDashboardError(error);
      }
    } finally {
      if (getInFlightSupervisorDashboardRequest() === request) {
        setInFlightSupervisorDashboardRequest(null);
      }
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return {
    dashboard: state.dashboard,
    isLoading: state.isLoading,
    error: state.error,
    reload: () => loadDashboard(true),
  };
}
