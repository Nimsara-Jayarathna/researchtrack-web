import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ROLE_HOME } from "./roleHome";
import { useAuthStateValue } from "@/features/auth/state/authState";

function buildLoginRedirectPath(
  pathname: string,
  search: string,
  hash: string,
): string {
  const returnTo = `${pathname}${search}${hash}`;
  try {
    const key = `login-return:${Date.now()}:${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(key, returnTo);
    return `/login?returnToKey=${encodeURIComponent(key)}`;
  } catch {
    return "/login";
  }
}

/** Blocks unauthenticated users while the server remains the session authority. */
export function RequireAuth() {
  const location = useLocation();
  const authState = useAuthStateValue();

  if (authState.status === "bootstrapping") return null;
  if (!authState.user) {
    return (
      <Navigate
        to={buildLoginRedirectPath(
          location.pathname,
          location.search,
          location.hash,
        )}
        replace
      />
    );
  }

  return <Outlet />;
}

/**
 * UI role guard. Backend authorization remains authoritative for every
 * protected operation; there is intentionally no development bypass.
 */
export function RequireRole({ role }: { role: string }) {
  const location = useLocation();
  const authState = useAuthStateValue();

  if (authState.status === "bootstrapping") return null;
  const user = authState.user;
  if (!user) {
    return (
      <Navigate
        to={buildLoginRedirectPath(
          location.pathname,
          location.search,
          location.hash,
        )}
        replace
      />
    );
  }

  if (user.role !== role) {
    return <Navigate to={ROLE_HOME[user.role] ?? "/"} replace />;
  }

  return <Outlet />;
}

/** Blocks authenticated users from guest-only pages. */
export function RequireGuest() {
  const authState = useAuthStateValue();
  if (authState.status === "bootstrapping") return null;
  if (!authState.user) return <Outlet />;
  return <Navigate to={ROLE_HOME[authState.user.role] ?? "/"} replace />;
}
