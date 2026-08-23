import { useEffect, type ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { bootstrapAuthSession } from "@/features/auth/state/authBootstrap";

function AuthSessionBootstrap({ children }: { children: ReactNode }) {
  useEffect(() => {
    void bootstrapAuthSession();
  }, []);

  return children;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <AuthSessionBootstrap>{children}</AuthSessionBootstrap>
    </BrowserRouter>
  );
}
