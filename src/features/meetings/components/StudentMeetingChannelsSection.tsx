import { ErrorState } from "@/components/feedback/ErrorState";
import { Button } from "@/components/ui/Button";
import { RequestStateModal } from "@/components/ui/RequestStateModal";
import { RefreshCw, Plus } from "lucide-react";
import { MeetingChannelFormModal } from "./MeetingChannelFormModal";
import { MeetingChannelsTable } from "./MeetingChannelsTable";
import { useStudentMeetingChannelsState } from "../hooks/useStudentMeetingChannelsState";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconActionButton } from "@/components/ui/IconActionButton";
import { MeetingSectionSkeleton } from "./MeetingSectionSkeleton";

type StudentMeetingChannelsSectionProps = {
  projectId: string;
  enabled?: boolean;
};

export function StudentMeetingChannelsSection({
  projectId,
  enabled = true,
}: StudentMeetingChannelsSectionProps) {
  const state = useStudentMeetingChannelsState(projectId, enabled);

  return (
    <>
      <SectionCard
        title="Meeting Channels"
        subtitle="Add the meeting link or identifier for your project meetings."
        actions={
          <>
            <IconActionButton
              label="Refresh channels"
              title="Refresh channels"
              onClick={() => void state.refresh()}
              disabled={state.isLoading}
              icon={
                <RefreshCw
                  className={`h-4 w-4 ${state.isLoading ? "animate-spin" : ""}`}
                />
              }
            />
            <Button
              variant="primary"
              size="sm"
              onClick={state.openAdd}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add channel
            </Button>
          </>
        }
      >
        {state.isLoading ? (
          <MeetingSectionSkeleton />
        ) : null}

        {state.error ? (
          <ErrorState error={state.error} onRetry={() => void state.load()} />
        ) : null}

        {!state.isLoading && !state.error ? (
          <MeetingChannelsTable
            channels={state.channels}
            canManage={false}
            onCopy={state.copyToClipboard}
          />
        ) : null}
      </SectionCard>

      <MeetingChannelFormModal
        isOpen={state.isFormOpen}
        mode="add"
        initialChannel={null}
        onClose={state.closeForm}
        onSubmit={(payload) => void state.submitForm(payload)}
      />

      <RequestStateModal
        isOpen={state.requestModal.isOpen}
        status={state.requestModal.status}
        title={state.requestModal.title}
        message={state.requestModal.message}
        onClose={
          state.requestModal.status === "loading"
            ? undefined
            : state.closeRequestModal
        }
        onRetry={
          state.requestModal.status === "error"
            ? (state.requestModal.retryAction ?? undefined)
            : undefined
        }
      />
    </>
  );
}
