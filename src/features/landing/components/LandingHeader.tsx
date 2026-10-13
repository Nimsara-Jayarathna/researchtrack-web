import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";

const links = [
  { href: "#platform", label: "Platform" },
  { href: "#features", label: "Features" },
  { href: "#workflow", label: "How it works" },
  { href: "#audiences", label: "Who it's for" },
];

type LandingHeaderProps = {
  onLogin: () => void;
  onRegister: () => void;
};

export function LandingHeader({ onLogin, onRegister }: LandingHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          aria-label="ResearchTrack home"
          className="shrink-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600"
        >
          <Logo size={38} showWordmark />
        </Link>
        <nav
          aria-label="Landing page sections"
          className="hidden items-center gap-1 lg:flex"
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-600"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <Button variant="ghost" onClick={onLogin}>
            Sign in
          </Button>
          <Button variant="primary" onClick={onRegister}>
            Get started <ArrowUpRight size={15} aria-hidden="true" />
          </Button>
        </div>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-600 lg:hidden"
          aria-label={
            mobileOpen ? "Close navigation menu" : "Open navigation menu"
          }
          aria-expanded={mobileOpen}
          aria-controls="landing-mobile-menu"
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {mobileOpen && (
        <nav
          id="landing-mobile-menu"
          aria-label="Mobile landing page navigation"
          className="border-t border-slate-200 bg-white px-4 pb-5 pt-3 lg:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setMobileOpen(false);
                  onLogin();
                }}
              >
                Sign in
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setMobileOpen(false);
                  onRegister();
                }}
              >
                Get started
              </Button>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
