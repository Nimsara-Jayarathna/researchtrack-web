import { StudentSubmissionsSection } from "@/features/submissions/components/StudentSubmissionsSection";
import type {
  ProjectFile,
  ProjectFileConfig,
} from "@/features/projectfiles/types";

type StudentFilesTabSectionProps = {
  projectId: string;
  initialFiles?: {
    items: ProjectFile[];
    config: ProjectFileConfig;
  } | null;
};

export function StudentFilesTabSection({
  projectId,
}: StudentFilesTabSectionProps) {
  return <StudentSubmissionsSection projectId={projectId} />;
}
