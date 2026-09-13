import { useEffect, type ReactNode } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import { bootstrapAuthSession } from "@/features/auth/state/authBootstrap";

function AuthSessionBootstrap({ children }: { children: ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    // A reset link is deliberately self-contained and anonymous. Bootstrapping
    // /me here can race with token validation during development StrictMode and
    // provides no value to the reset flow.
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
