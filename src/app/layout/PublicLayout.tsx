import type { ReactNode } from "react";
import { TopBar } from "@/components/ui/TopBar";
import { LandingHeader } from "@/features/landing/components/LandingHeader";

type PublicLayoutProps = {
  onLogin: () => void;
  onRegister: () => void;
  landing?: boolean;
  children?: ReactNode;
};

export function PublicLayout({ onLogin, onRegister, landing = false, children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      {landing ? (
        <LandingHeader onLogin={onLogin} onRegister={onRegister} />
      ) : (
        <TopBar mode="public" homePath="/" actions={[
          { label: "Login", onClick: onLogin, variant: "ghost" },
          { label: "Register", onClick: onRegister, variant: "primary" },
        ]} />
      )}
      <main id="main-content">{children ?? "Public Layout Placeholder"}</main>
    </div>
  );
}
