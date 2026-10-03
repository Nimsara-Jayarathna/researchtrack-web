import { SupervisorSubmissionRequirementsSection } from "@/features/submissions/components/SupervisorSubmissionRequirementsSection";
import type {
  ProjectFile,
  ProjectFileConfig,
} from "@/features/projectfiles/types";

type FilesTabSectionProps = {
  projectId: string;
  initialFiles?: {
    items: ProjectFile[];
    config: ProjectFileConfig;
  } | null;
};

export function FilesTabSection({ projectId }: FilesTabSectionProps) {
  return <SupervisorSubmissionRequirementsSection projectId={projectId} />;
}
