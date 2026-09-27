import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, X } from "lucide-react";

type GithubDetailsModalProps = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onBack?: () => void;
  backLabel?: string;
  children: ReactNode;
};

export function GithubDetailsModal({
  isOpen,
  title,
  onClose,
  onBack,
  backLabel = "Back",
  children,
}: GithubDetailsModalProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsMounted(false);
      return;
    }

    const rafId = window.requestAnimationFrame(() => {
      setIsMounted(true);
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (onBack) {
          onBack();
        } else {
          onClose();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onBack, onClose]);

  if (!isOpen) {
    return null;
  }

  const modal = (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 px-4 py-4 backdrop-blur-[2px] transition-opacity duration-200 ${isMounted ? "opacity-100" : "opacity-0"}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`flex h-[min(82vh,760px)] max-h-[calc(100vh-2rem)] w-[min(1100px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-[0_28px_80px_rgba(15,23,42,0.28)] transition-all duration-200 ${isMounted ? "translate-y-0 scale-100 opacity-100" : "translate-y-1 scale-[0.99] opacity-0"}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-foreground"
                aria-label={backLabel}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{backLabel}</span>
              </button>
            ) : null}
            <h3 className="truncate text-lg font-semibold text-foreground">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return modal;
  }

  return createPortal(modal, document.body);
}
