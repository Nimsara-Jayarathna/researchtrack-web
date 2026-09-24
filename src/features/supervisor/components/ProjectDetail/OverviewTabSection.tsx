import { ProjectOverviewContent } from "@/features/projects/components/ProjectOverviewContent";
import type { OverviewState } from "../../hooks/useProjectDetailsPageState";
import { FIELD_LIMITS, LIFECYCLE_OPTIONS } from "../../projectDetails.shared";
import type {
  SupervisorProjectLifecycle,
  SupervisorProjectDetail,
} from "../../types";

type OverviewTabSectionProps = {
  project: SupervisorProjectDetail;
  overview: OverviewState;
};

export function OverviewTabSection({
  project,
  overview,
}: OverviewTabSectionProps) {
  return (
    <ProjectOverviewContent
      project={project}
      role="supervisor"
      edit={{
        isEditing: overview.isEditingOverview,
        isSaving: overview.isSavingOverview,
        isDirty: overview.isOverviewDirty,
        form: overview.overviewForm,
        lifecycleOptions: LIFECYCLE_OPTIONS,
        fieldLimits: FIELD_LIMITS,
        onStartEdit: overview.startEdit,
        onCancelEdit: overview.cancelEdit,
        onSubmit: overview.submit,
        onChangeField: overview.setField,
        onLifecycleChange: (value) =>
          overview.setField(
            "lifecycleStatus",
            value as SupervisorProjectLifecycle,
          ),
      }}
    />
  );
}
