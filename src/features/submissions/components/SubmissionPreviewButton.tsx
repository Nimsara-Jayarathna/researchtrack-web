import { Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { SubmissionVersion } from "../types";
import {
  previewUnavailableMessage,
  submissionPreviewKind,
} from "../lib/submissionPreview";

type Props = {
  version: SubmissionVersion;
  busy?: boolean;
  onPreview: () => void;
};

export function SubmissionPreviewButton({
  version,
  busy = false,
  onPreview,
}: Props) {
  const supported = submissionPreviewKind(version) !== null;
  const tooltip = previewUnavailableMessage(version);

  if (supported) {
    return (
      <Button
        size="sm"
        variant="secondary"
        disabled={busy}
        leftIcon={<Eye className="h-4 w-4" />}
        onClick={onPreview}
      >
        Preview
      </Button>
    );
  }

  return (
    <span
      className="group relative inline-flex"
      tabIndex={0}
      aria-label={tooltip}
      title={tooltip}
    >
      <Button
        size="sm"
        variant="secondary"
        disabled
        leftIcon={<Eye className="h-4 w-4" />}
      >
        Preview
      </Button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-64 -translate-x-1/2 rounded-xl bg-slate-900 px-3 py-2 text-center text-xs font-medium leading-5 text-white shadow-lg group-hover:block group-focus:block"
      >
        {tooltip}
      </span>
    </span>
  );
}
