import { useCallback, useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Button, buttonStyles } from "@/components/ui/Button";
import { PageTabs } from "@/components/ui/PageTabs";
import { RequestStateModal } from "@/components/ui/RequestStateModal";
import { ProjectDetailsSkeleton } from "../components/ProjectDetailsSkeleton";
import { IntegrationsTabSection } from "../components/ProjectDetail/IntegrationsTabSection";
import { JiraTabSection } from "../components/ProjectDetail/JiraTabSection";
import { MilestonesTabSection } from "../components/ProjectDetail/MilestonesTabSection";
import { OverviewTabSection } from "../components/ProjectDetail/OverviewTabSection";
import { TeamTabSection } from "../components/ProjectDetail/TeamTabSection";
import { FilesTabSection } from "../components/ProjectDetail/FilesTabSection";
import { MeetingsTabSection } from "../components/ProjectDetail/MeetingsTabSection";
import { SupervisorProjectDetailsKpis } from "../components/projectDetails/SupervisorProjectDetailsKpis";
import { ProjectHeroCard } from "@/components/ui/ProjectHeroCard";
import { LifecycleStatus } from "@/components/lifecycle";
import { SupervisorProjectGitHubTab } from "../components/projectDetails/SupervisorProjectGitHubTab";
import { useProjectRepositories } from "../hooks/useProjectRepositories";
import { useProjectDetailsPageState } from "../hooks/useProjectDetailsPageState";
import { useSupervisorProject } from "../hooks/useSupervisorProject";
import { toTabLabel } from "../projectDetails.shared";
import type {
  SupervisorProjectDetailTab,
  SupervisorProjectLifecycle,
} from "../types";
import { useProjectDetailsRefreshRequestModal } from "../hooks/projectDetails/useProjectDetailsRefreshRequestModal";
import { useSupervisorProjectDetailsTabs } from "../hooks/projectDetails/useSupervisorProjectDetailsTabs";
import { useSupervisorProjectGitHubDashboard } from "../hooks/projectDetails/useSupervisorProjectGitHubDashboard";
import { useSupervisorProjectJiraFlow } from "../hooks/projectDetails/useSupervisorProjectJiraFlow";
import { useSupervisorProjectGitHubSetupRedirect } from "../hooks/projectDetails/useSupervisorProjectGitHubSetupRedirect";

export function ProjectDetailsPage() {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    tabs: allowedTabs,
    activeTab,
    setActiveTab,
  } = useSupervisorProjectDetailsTabs(searchParams, setSearchParams);

  const refreshRequestModal = useProjectDetailsRefreshRequestModal({
    searchParams,
    setSearchParams,
  });

  const {
    project: loadedProject,
    isLoading,
    error,
    reload,
  } = useSupervisorProject(projectId);
  const { project, overview, team, milestones, requestModal, actions } =
    useProjectDetailsPageState({
      projectId,
      loadedProject,
    });

  const projectRepositoriesState = useProjectRepositories(projectId, {
    enabled: Boolean(projectId),
  });

  const projectWithIntegrations = useMemo(
    () =>
      project
        ? {
            ...project,
            githubRepositories:
              projectRepositoriesState.data ?? project.githubRepositories,
          }
        : null,
    [project, projectRepositoriesState.data],
  );

  const githubSetupRedirect = useSupervisorProjectGitHubSetupRedirect({
    projectId,
    searchParams,
    setSearchParams,
    refreshModal: { showError: refreshRequestModal.showError },
  });

  const githubDashboard = useSupervisorProjectGitHubDashboard({
    projectId,
    isActive: activeTab === "github",
    githubRepositories: projectRepositoriesState.data,
    reloadRepositories: projectRepositoriesState.reload,
    refreshModal: {
      showLoading: refreshRequestModal.showLoading,
      showSuccess: refreshRequestModal.showSuccess,
      showError: refreshRequestModal.showError,
    },
  });

  const jiraFlow = useSupervisorProjectJiraFlow({
    projectId,
    searchParams,
    setSearchParams,
    reloadProject: reload,
    refreshModal: {
      showLoading: refreshRequestModal.showLoading,
      showSuccess: refreshRequestModal.showSuccess,
      showError: refreshRequestModal.showError,
      hide: refreshRequestModal.hide,
    },
  });

  const retryLoad = useCallback(() => {
    void reload();
  }, [reload]);

  if (isLoading) return <ProjectDetailsSkeleton />;

  if (error) {
    if (error.code === "NOT_FOUND") {
      return (
        <div className="rounded-3xl border border-dashed border-border bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-foreground">
            Project not found
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            The requested supervisor project could not be found or is not
            available to your account.
          </p>
          <Link
            to="/supervisor/projects"
            className={buttonStyles({
              variant: "primary",
              size: "md",
              className: "mt-6",
            })}
          >
            Back to projects
          </Link>
        </div>
      );
    }
    return <ErrorState error={error} onRetry={retryLoad} />;
  }

  if (!project) return null;

  return (
    <div className="space-y-6">
      <RequestStateModal
        isOpen={requestModal.state.isOpen}
        status={requestModal.state.status}
        title={requestModal.state.title}
        message={requestModal.state.message}
        onClose={
          requestModal.state.status === "loading"
            ? undefined
            : requestModal.close
        }
        onRetry={
          requestModal.state.status === "error"
            ? requestModal.retryLastRequest
            : undefined
        }
      />
      <RequestStateModal
        isOpen={refreshRequestModal.state.isOpen}
        status={refreshRequestModal.state.status}
        title={refreshRequestModal.state.title}
        message={refreshRequestModal.state.message}
        onClose={
          refreshRequestModal.state.status === "loading"
            ? undefined
            : refreshRequestModal.close
        }
        onRetry={
          refreshRequestModal.state.status === "error"
            ? refreshRequestModal.state.retryAction
            : undefined
        }
        autoCloseOnSuccess={!refreshRequestModal.state.redirectToJiraOnClose}
      />
      <RequestStateModal
        isOpen={jiraFlow.isJiraDisconnectConfirmOpen}
        status="warning"
        title="Disconnect Jira workspace?"
        message="This project will stop receiving Jira-linked data until you connect again."
        onClose={() => jiraFlow.setIsJiraDisconnectConfirmOpen(false)}
        autoCloseOnSuccess={false}
        footer={
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => jiraFlow.setIsJiraDisconnectConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              onClick={() => void jiraFlow.confirmDisconnectJira()}
            >
              Disconnect
            </Button>
          </div>
        }
      />
      <RequestStateModal
        isOpen={jiraFlow.jiraWorkspaceSelection.isOpen}
        status="warning"
        title={
          jiraFlow.jiraWorkspaceSelection.phase === "workspace"
            ? "Select Jira workspace"
            : "Select Jira project and board"
        }
        message={
          jiraFlow.jiraWorkspaceSelection.phase === "workspace"
            ? "Multiple Jira workspaces are available. Choose the workspace that contains this research project."
            : "Choose the Jira project and, when available, the Scrum or Kanban board to link to ResearchTrack."
        }
        onClose={jiraFlow.cancelJiraWorkspaceSelection}
        autoCloseOnSuccess={false}
        content={
          jiraFlow.jiraWorkspaceSelection.phase === "workspace" ? (
            <div className="max-h-60 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 text-left">
              {jiraFlow.jiraWorkspaceSelection.workspaceOptions.map(
                (option) => (
                  <label
                    key={option.cloudId}
                    className="flex cursor-pointer items-start gap-2 rounded-xl border border-slate-200 p-2 hover:bg-slate-50"
                  >
                    <input
                      type="radio"
                      name="jira-workspace-option"
                      className="mt-1"
                      checked={
                        jiraFlow.jiraWorkspaceSelection.selectedCloudId ===
                        option.cloudId
                      }
                      onChange={() =>
                        jiraFlow.setJiraWorkspaceSelection((current) => ({
                          ...current,
                          selectedCloudId: option.cloudId,
                        }))
                      }
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-900">
                        {option.workspaceName}
                      </span>
                      {option.workspaceUrl ? (
                        <span className="block truncate text-xs text-slate-600">
                          {option.workspaceUrl}
                        </span>
                      ) : null}
                    </span>
                  </label>
                ),
              )}
            </div>
          ) : (
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 text-left">
              <label className="block text-sm font-semibold text-slate-800">
                Jira project
                <select
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                  value={
                    jiraFlow.jiraWorkspaceSelection.selectedProjectId ?? ""
                  }
                  onChange={(event) =>
                    jiraFlow.setJiraWorkspaceSelection((current) => ({
                      ...current,
                      selectedProjectId: event.target.value || null,
                      boardOptions: [],
                      selectedBoardId: null,
                    }))
                  }
                >
                  {jiraFlow.jiraWorkspaceSelection.projectOptions.map(
                    (option) => (
                      <option key={option.id} value={option.id}>
                        {option.name} ({option.key})
                      </option>
                    ),
                  )}
                </select>
              </label>
              {jiraFlow.jiraWorkspaceSelection.boardOptions.length > 0 ? (
                <label className="block text-sm font-semibold text-slate-800">
                  Jira board
                  <select
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                    value={
                      jiraFlow.jiraWorkspaceSelection.selectedBoardId ?? ""
                    }
                    onChange={(event) =>
                      jiraFlow.setJiraWorkspaceSelection((current) => ({
                        ...current,
                        selectedBoardId: event.target.value
                          ? Number(event.target.value)
                          : null,
                      }))
                    }
                  >
                    {jiraFlow.jiraWorkspaceSelection.boardOptions.map(
                      (option) => (
                        <option key={option.id} value={option.id}>
                          {option.name} ({option.type})
                        </option>
                      ),
                    )}
                  </select>
                </label>
              ) : (
                <p className="text-xs text-slate-600">
                  Continue to load boards for the selected Jira project.
                  Projects without a board can still be linked.
                </p>
              )}
            </div>
          )
        }
        footer={
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={jiraFlow.cancelJiraWorkspaceSelection}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => void jiraFlow.confirmJiraWorkspaceSelection()}
            >
              {jiraFlow.jiraWorkspaceSelection.phase === "workspace"
                ? "Continue"
                : jiraFlow.jiraWorkspaceSelection.boardOptions.length > 0
                  ? "Link Jira project"
                  : "Continue"}
            </Button>
          </div>
        }
      />

      <ProjectHeroCard
        title={project.title}
        subtitle={
          project.summary ??
          "No summary has been recorded for this project yet."
        }
        rightSlot={
          <LifecycleStatus
            value={actions.quickLifecycleStatus}
            canEdit
            disabled={actions.isUpdatingStatus}
            onChange={(status) =>
              actions.handleQuickStatusChange(
                status as SupervisorProjectLifecycle,
              )
            }
          />
        }
        kpiSlot={
          <SupervisorProjectDetailsKpis
            batch={project.batch}
            semester={project.semester}
            milestonesCount={project.milestones.length}
            progressPercent={project.progressPercent}
          />
        }
      />

      <PageTabs
        items={allowedTabs.map((tab) => ({
          value: tab,
          label: toTabLabel(tab),
        }))}
        value={activeTab}
        onChange={(value) => setActiveTab(value as SupervisorProjectDetailTab)}
        tone="supervisor"
      />

      {activeTab === "overview" ? (
        <OverviewTabSection
          project={projectWithIntegrations ?? project}
          overview={overview}
        />
      ) : null}

      {activeTab === "team" ? (
        <TeamTabSection project={project} team={team} />
      ) : null}

      {activeTab === "milestones" ? (
        <MilestonesTabSection project={project} milestones={milestones} />
      ) : null}

      {activeTab === "files" ? (
        <FilesTabSection projectId={project.id} initialFiles={project.files} />
      ) : null}

      {activeTab === "meetings" ? (
        <MeetingsTabSection projectId={project.id} />
      ) : null}

      {activeTab === "github" ? (
        <SupervisorProjectGitHubTab
          isPageLoading={isLoading}
          isRepositoriesLoading={projectRepositoriesState.isLoading}
          repositoriesError={projectRepositoriesState.error}
          isGitHubViewLoading={githubDashboard.isGitHubViewLoading}
          isRefreshingGitHub={githubDashboard.isRefreshingGitHub}
          enabledRepositories={githubDashboard.enabledRepositories}
          selectedRepoId={githubDashboard.selectedRepoId}
          activeRepository={githubDashboard.activeRepository}
          activeRepositorySyncStatus={
            githubDashboard.activeRepositorySyncStatus
          }
          isRepoSelectorOpen={githubDashboard.isRepoSelectorOpen}
          setIsRepoSelectorOpen={githubDashboard.setIsRepoSelectorOpen}
          githubView={githubDashboard.githubView}
          githubViewError={githubDashboard.githubViewError}
          onSelectRepository={(linkedRepositoryId) => {
            void githubDashboard.selectRepository(linkedRepositoryId);
          }}
          onRefreshGitHub={() => {
            void githubDashboard.refreshGitHub();
          }}
          onRetryGitHubDashboard={() => {
            void githubDashboard.retryGitHubView();
          }}
          loadActivityPage={githubDashboard.loadActivityPage}
          loadContributorsPage={githubDashboard.loadContributorsPage}
          loadPullRequestsPage={githubDashboard.loadPullRequestsPage}
          onNavigateToOverview={() => setActiveTab("integrations")}
        />
      ) : null}

      {activeTab === "jira" ? (
        <JiraTabSection
          project={project}
          onConnect={jiraFlow.handleConnectJira}
          isConnecting={jiraFlow.isConnectingJira}
        />
      ) : null}

      {activeTab === "integrations" ? (
        <IntegrationsTabSection
          project={project}
          repositoriesState={projectRepositoriesState}
          onConnectJira={jiraFlow.handleConnectJira}
          onDisconnectJira={jiraFlow.handleDisconnectJira}
          isConnectingJira={jiraFlow.isConnectingJira}
          isDisconnectingJira={jiraFlow.isDisconnectingJira}
          pendingGitHubSourceId={githubSetupRedirect.pendingGitHubSourceId}
          pendingGitHubFlowType={githubSetupRedirect.pendingGitHubFlowType}
          onPendingGitHubSourceHandled={
            githubSetupRedirect.onPendingGitHubSourceHandled
          }
        />
      ) : null}
    </div>
  );
}
