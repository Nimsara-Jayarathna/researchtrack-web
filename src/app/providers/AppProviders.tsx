import { useEffect, type ReactNode } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import { bootstrapAuthSession } from "@/features/auth/state/authBootstrap";

function AuthSessionBootstrap({ children }: { children: ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    // Password reset is intentionally anonymous. Bootstrapping /me on this
    // route can race with reset-token validation and provides no value here.
    if (location.pathname === "/reset-password") {
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
