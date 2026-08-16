import { cn } from '@/lib/cn';

type LogoMarkProps = {
  /** Square size in px */
  size?: number;
  className?: string;
};

type LogoProps = LogoMarkProps & {
  /** Show wordmark "ResearchTrack" beside the mark */
  showWordmark?: boolean;
};

/**
 * LogoMark — renders the ResearchTrack logo mark at the given square size.
 */
export function LogoMark({ size = 40, className }: LogoMarkProps) {
  return (
    <img
      src="/logo.svg"
      alt="ResearchTrack"
      width={size}
      height={size}
      className={cn('inline-block flex-shrink-0', className)}
      draggable={false}
    />
  );
}

/**
 * Logo — renders the logo mark with an optional "ResearchTrack" wordmark.
 */
export function Logo({ size = 40, showWordmark = false, className }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark size={size} />
      {showWordmark && (
        <span
          className="font-semibold tracking-tight text-foreground"
          style={{ fontSize: size * 0.45 }}
        >
          ResearchTrack
        </span>
      )}
    </span>
  );
}
