import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

type FinalCTASectionProps = { onRegister: () => void; onLogin: () => void };

export function FinalCTASection({ onRegister, onLogin }: FinalCTASectionProps) {
  return (
    <>
      <section
        id="get-started"
        aria-labelledby="get-started-heading"
        className="scroll-mt-24 bg-[#0b2140] px-4 py-20 text-white sm:px-6 sm:py-24 lg:px-8"
      >
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">
            MOVE RESEARCH FORWARD
          </p>
          <h2
            id="get-started-heading"
            className="mx-auto mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl"
          >
            Give every research project a clearer path forward.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300">
            Bring the work, milestones, and reviews into one place — so progress
            is easier to see and guidance is easier to act on.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button
              variant="marketing"
              size="lg"
              onClick={onRegister}
              className="h-12 rounded-xl px-6"
            >
              Get started <ArrowRight size={17} aria-hidden="true" />
            </Button>
            <Button
              variant="marketing-outline"
              size="lg"
              onClick={onLogin}
              className="h-12 rounded-xl px-6"
            >
              Sign in <ArrowUpRight size={17} aria-hidden="true" />
            </Button>
          </div>
          <p className="mt-5 text-xs text-slate-400">
            Account eligibility may depend on your institution&apos;s
            registration settings.
          </p>
        </div>
      </section>
      <footer className="bg-[#07152e] px-4 py-10 text-slate-300 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-bold text-white">ResearchTrack</p>
            <p className="mt-1 text-xs text-slate-400">
              Connected research supervision and project delivery.
            </p>
          </div>
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap gap-x-5 gap-y-3 text-sm"
          >
            <Link
              to="/support"
              className="hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300"
            >
              Support
            </Link>
            <Link
              to="/legal/privacy"
              className="hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300"
            >
              Privacy
            </Link>
            <Link
              to="/legal/terms"
              className="hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300"
            >
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
