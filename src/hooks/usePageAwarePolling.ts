import { useEffect, useRef } from "react";

type Options = {
  enabled: boolean;
  intervalMs: number;
  run: () => Promise<void>;
  runImmediately?: boolean;
};

export function usePageAwarePolling({
  enabled,
  intervalMs,
  run,
  runImmediately = true,
}: Options): void {
  const runRef = useRef(run);
  runRef.current = run;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let timeoutId: number | null = null;
    let running = false;

    const clearTimer = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const canRun = () =>
      document.visibilityState === "visible" && navigator.onLine !== false;

    const schedule = () => {
      clearTimer();
      if (!cancelled && canRun()) {
        timeoutId = window.setTimeout(() => void execute(), intervalMs);
      }
    };

    const execute = async () => {
      if (cancelled || running || !canRun()) return;
      running = true;
      try {
        await runRef.current();
      } catch {
        // Passive freshness checks are best-effort. Existing visible data stays usable.
      } finally {
        running = false;
        schedule();
      }
    };

    const onVisibility = () => {
      clearTimer();
      if (canRun()) void execute();
    };
    const onOnline = () => {
      clearTimer();
      void execute();
    };
    const onOffline = () => clearTimer();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    if (runImmediately && canRun()) void execute();
    else schedule();

    return () => {
      cancelled = true;
      clearTimer();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [enabled, intervalMs, runImmediately]);
}
