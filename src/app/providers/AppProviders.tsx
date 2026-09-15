import { useEffect, type ReactNode } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import { bootstrapAuthSession } from "@/features/auth/state/authBootstrap";

function isSessionlessPublicRoute(pathname: string): boolean {
  return (
    pathname === "/reset-password" ||
    pathname === "/github/request-access" ||
    pathname.startsWith("/github/access-request/") ||
    pathname === "/github/access-request/result" ||
    pathname === "/github/access-updated"
  );
}

function AuthSessionBootstrap({ children }: { children: ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    // Token-driven public flows do not participate in the ResearchTrack user
    // session. In particular, an external GitHub owner may not have an account,
    // so these routes must never bootstrap /me or refresh authentication.
    if (isSessionlessPublicRoute(location.pathname)) {
      return;
    }

    void bootstrapAuthSession();
  }, [location.pathname]);

  return children;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <AuthSessionBootstrap>{children}</AuthSessionBootstrap>
    </BrowserRouter>
  );
}
