import { SupervisorSubmissionRequirementsSection } from "@/features/submissions/components/SupervisorSubmissionRequirementsSection";
import type { SupervisorProjectDetail } from "../../types";

type FilesTabSectionProps = {
  project: SupervisorProjectDetail;
  onManageMembers: () => void;
};

export function FilesTabSection({
  project,
  onManageMembers,
}: FilesTabSectionProps) {
  const studentMembers = project.members
    .filter((member) => member.memberRole === "STUDENT")
    .map((member) => ({
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
    }));

  return (
    <SupervisorSubmissionRequirementsSection
      projectId={project.id}
      projectLeader={project.leader}
      studentMembers={studentMembers}
      onManageMembers={onManageMembers}
    />
  );
}
