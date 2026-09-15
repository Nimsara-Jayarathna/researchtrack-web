import { useEffect, useMemo, useRef, useState } from "react";
import { buttonStyles } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LastSyncedBadge } from "@/components/ui/LastSyncedBadge";
import { RequestStateModal } from "@/components/ui/RequestStateModal";
import { GithubDetailsModal } from "@/features/projects/components/GithubDetailsModal";
import { normalizeSyncStatus, toSyncLabel } from "@/lib/syncStatus";
import { isApiException } from "@/services/apiClient";
import { CheckCircle2, Github } from "lucide-react";
import { supervisorApi } from "../../api/supervisorApi";
import { useAvailableRepositories } from "../../hooks/useAvailableRepositories";
import { useGitHubSetupFlow } from "../../hooks/useGitHubSetupFlow";
import { useRepositorySelection } from "../../hooks/useRepositorySelection";
import type { UseProjectRepositoriesState } from "../../hooks/useProjectRepositories";
import type {
  GitHubAccessRequestSummary,
  ProjectGitHubRepositories,
  SupervisorProjectDetail,
} from "../../types";
import {
  RepositoryLinkModalContent,
  type RepositoryLinkMethod,
} from "./RepositoryLinkModalContent";
import {
  RepositoryManagementModalContent,
  type RepositoryManagementRow,
  type RepositoryManagementSource,
} from "./RepositoryManagementModalContent";
import { RepositoryRenameModal } from "./RepositoryRenameModal";

type RepositorySectionProps = {
  project: SupervisorProjectDetail;
  repositoriesState: UseProjectRepositoriesState;
  pendingSourceId?: string | null;
  pendingFlowType?: "INSTALLATION_DIRECT" | "INSTALLATION_REQUESTED" | null;
  onPendingSourceHandled?: () => void;
};

type ModalStep = "method" | "repository-selection";
type RepositorySelectionEntryMode =
  "manual" | "callback-direct" | "callback-requested";

type RequestModalState = {
  isOpen: boolean;
  status: "loading" | "success" | "error";
  title: string;
  message: string;
};

function toSourceLabel(
  source: ProjectGitHubRepositories["accessSources"][number],
): string {
  return `${source.ownerLogin} (${source.accessType})`;
}

export function RepositorySection({
  project,
  repositoriesState,
  pendingSourceId,
  pendingFlowType,
  onPendingSourceHandled,
}: RepositorySectionProps) {
  const {
    data: repositoriesData,
    isLoading: isLoadingRepositoriesData,
    error: repositoriesDataError,
    reload: reloadRepositoriesData,
  } = repositoriesState;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>("method");
  const [selectedMethod, setSelectedMethod] =
    useState<RepositoryLinkMethod | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [selectionEntryMode, setSelectionEntryMode] =
    useState<RepositorySelectionEntryMode>("manual");

  const [isCreatingAccessRequest, setIsCreatingAccessRequest] = useState(false);
  const [accessRequestOwnerLogin, setAccessRequestOwnerLogin] = useState("");
  const [accessRequests, setAccessRequests] = useState<
    GitHubAccessRequestSummary[]
  >([]);
  const [isLoadingAccessRequests, setIsLoadingAccessRequests] = useState(false);
  const [revokingAccessRequestId, setRevokingAccessRequestId] = useState<
    string | null
  >(null);
  const [isConfirmingRepositorySelection, setIsConfirmingRepositorySelection] =
    useState(false);
  const [isDismissingPendingAccess, setIsDismissingPendingAccess] =
    useState(false);
  const [isResolvingPendingAccess, setIsResolvingPendingAccess] =
    useState(false);
  const [isMutatingLinks, setIsMutatingLinks] = useState(false);
  const [isAccessRequestLinkCopied, setIsAccessRequestLinkCopied] =
    useState(false);
  const [generatedAccessRequestUrl, setGeneratedAccessRequestUrl] = useState<
    string | null
  >(null);
  const [generatedAccessRequestExpiresAt, setGeneratedAccessRequestExpiresAt] =
    useState<string | null>(null);
  const [editingDisplayNameRowKey, setEditingDisplayNameRowKey] = useState<
    string | null
  >(null);
  const [editingDisplayNameDraft, setEditingDisplayNameDraft] = useState("");
  const [displayNameEditError, setDisplayNameEditError] = useState<
    string | null
  >(null);
  const [isSavingDisplayName, setIsSavingDisplayName] = useState(false);

  const [requestModal, setRequestModal] = useState<RequestModalState>({
    isOpen: false,
    status: "loading",
    title: "",
    message: "",
  });
  const [pendingUnlinkRepositoryId, setPendingUnlinkRepositoryId] = useState<
    string | null
  >(null);
  const [pendingDisconnectSourceId, setPendingDisconnectSourceId] = useState<
    string | null
  >(null);
  const [pendingDisableRepositoryId, setPendingDisableRepositoryId] = useState<
    string | null
  >(null);
  const [pendingRevokeAccessRequestId, setPendingRevokeAccessRequestId] =
    useState<string | null>(null);
  const autoOpenedPendingAccessRef = useRef(false);

  const { isStartingOwnerInstall, startOwnerInstall } = useGitHubSetupFlow(
    project.id,
  );

  const {
    data: availableRepositoriesData,
    isLoading: isLoadingAvailableRepositories,
    error: availableRepositoriesError,
    reload: reloadAvailableRepositories,
  } = useAvailableRepositories(
    modalStep === "repository-selection" ? selectedSourceId : null,
  );

  const linkedRepositories = useMemo(
    () => repositoriesData?.repositories ?? [],
    [repositoriesData?.repositories],
  );
  const accessSources = useMemo(
    () => repositoriesData?.accessSources ?? [],
    [repositoriesData?.accessSources],
  );
  const limitsLoaded = repositoriesData !== null;
  const maxLinkedRepositories = repositoriesData?.maxLinkedRepositories ?? 0;
  const maxEnabledRepositories = repositoriesData?.maxEnabledRepositories ?? 0;
  const linkedCount = linkedRepositories.length;
  const enabledCount = linkedRepositories.filter(
    (repository) => repository.enabled,
  ).length;
  const hasUnacknowledgedAccess =
    repositoriesData?.hasUnacknowledgedAccess ??
    Boolean(project.github.hasUnacknowledgedAccess);
  const remainingLinkSlots = Math.max(0, maxLinkedRepositories - linkedCount);
  const remainingEnabledSlots = Math.max(
    0,
    maxEnabledRepositories - enabledCount,
  );
  const linkedLimitReached = limitsLoaded && remainingLinkSlots < 1;
  const enabledLimitReached = limitsLoaded && remainingEnabledSlots < 1;
  const bothLimitsReached = linkedLimitReached && enabledLimitReached;
  const isDirectInstallationSelection =
    selectionEntryMode === "callback-direct";
  const repositorySelectionCapacity = Math.min(
    remainingLinkSlots,
    remainingEnabledSlots,
  );

  const managementRows = useMemo<RepositoryManagementRow[]>(() => {
    // The management modal is intentionally limited to repositories that are
    // already linked to this project. Available repositories from an access
    // source belong to the separate "Add repository" flow. Mixing both sets
    // made the UI show dozens of unlinked installation repositories even when
    // the project only had one or two actual links.
    return linkedRepositories
      .map((linked) => {
        const source = linked.sourceId
          ? accessSources.find((candidate) => candidate.id === linked.sourceId)
          : null;

        return {
          rowKey: linked.sourceId
            ? `${linked.sourceId}:${linked.githubRepoId}`
            : `linked:${linked.id}`,
          sourceId: linked.sourceId ?? null,
          accessType:
            source?.accessType ??
            linked.accessType ??
            (linked.sourceId ? "UNKNOWN" : "MANUAL"),
          githubRepositoryId: linked.githubRepositoryId,
          githubRepoId: linked.githubRepoId,
          linkId: linked.id,
          enabled: linked.enabled,
          primary: Boolean(linked.primary),
          customName: linked.customName,
          name: linked.name,
          fullName: linked.fullName,
          ownerLogin: linked.ownerLogin,
          url: linked.url,
          syncStatus: linked.syncStatus,
          accessStatus: linked.accessStatus,
        };
      })
      .sort((a, b) => {
        if (a.enabled !== b.enabled) {
          return a.enabled ? -1 : 1;
        }
        return (a.fullName ?? a.name ?? "").localeCompare(
          b.fullName ?? b.name ?? "",
        );
      });
  }, [accessSources, linkedRepositories]);

  const managementSources = useMemo<RepositoryManagementSource[]>(
    () =>
      accessSources.map((source) => {
        const sourceLinks = linkedRepositories.filter(
          (repository) => repository.sourceId === source.id,
        );
        return {
          id: source.id,
          ownerLogin: source.ownerLogin,
          accessType: source.accessType,
          installationId: source.installationId,
          connectionStatus: source.connectionStatus,
          linkedRepositoryCount: sourceLinks.length,
          hasSyncInProgress: sourceLinks.some(
            (repository) =>
              normalizeSyncStatus(repository.syncStatus) === "IN_PROGRESS",
          ),
        };
      }),
    [accessSources, linkedRepositories],
  );

  const selection = useRepositorySelection(
    repositorySelectionCapacity > 0 ? repositorySelectionCapacity : 0,
  );
  const clearSelection = selection.clear;

  const sourceById = useMemo(() => {
    return new Map(accessSources.map((source) => [source.id, source]));
  }, [accessSources]);

  const selectedSource = selectedSourceId
    ? (sourceById.get(selectedSourceId) ?? null)
    : null;

  const availableRepositoriesErrorMessage = useMemo(() => {
    if (!availableRepositoriesError) {
      return null;
    }

    if (
      availableRepositoriesError.code === "UNAUTHORIZED" ||
      availableRepositoriesError.code === "FORBIDDEN"
    ) {
      return "You no longer have permission to manage this project's GitHub integration.";
    }
    if (availableRepositoriesError.code === "NOT_FOUND") {
      return isDirectInstallationSelection
        ? "GitHub App access was removed or is no longer available for this project. Reconnect GitHub and try again."
        : availableRepositoriesError.message;
    }
    if (availableRepositoriesError.code === "SERVICE_UNAVAILABLE") {
      return "GitHub is unavailable right now. Retry loading repositories shortly.";
    }
    return availableRepositoriesError.message;
  }, [availableRepositoriesError, isDirectInstallationSelection]);

  useEffect(() => {
    if (!pendingSourceId) {
      return;
    }

    clearSelection();
    setIsModalOpen(true);
    setModalStep("repository-selection");
    setSelectedMethod(
      pendingFlowType === "INSTALLATION_REQUESTED"
        ? "INSTALLATION_REQUESTED"
        : "INSTALLATION_DIRECT",
    );
    setSelectedSourceId(pendingSourceId);
    setSelectionEntryMode(
      pendingFlowType === "INSTALLATION_REQUESTED"
        ? "callback-requested"
        : "callback-direct",
    );
    onPendingSourceHandled?.();
  }, [
    clearSelection,
    onPendingSourceHandled,
    pendingFlowType,
    pendingSourceId,
  ]);

  useEffect(() => {
    if (!isModalOpen && !pendingSourceId) {
      setGeneratedAccessRequestUrl(null);
      setGeneratedAccessRequestExpiresAt(null);
      setIsAccessRequestLinkCopied(false);
      setAccessRequestOwnerLogin("");
      setSelectedMethod(null);
      setSelectedSourceId(null);
      setSelectionEntryMode("manual");
      setModalStep("method");
      clearSelection();
    }
  }, [clearSelection, isModalOpen, pendingSourceId]);

  useEffect(() => {
    if (
      !isModalOpen ||
      selectedMethod !== "INSTALLATION_REQUESTED" ||
      modalStep !== "method"
    ) {
      return;
    }
    void loadAccessRequests();
    // loadAccessRequests intentionally reads the current project id only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, modalStep, selectedMethod, project.id]);

  useEffect(() => {
    if (isManagementModalOpen) {
      return;
    }

    setEditingDisplayNameRowKey(null);
    setEditingDisplayNameDraft("");
    setDisplayNameEditError(null);
  }, [isManagementModalOpen]);

  useEffect(() => {
    if (!hasUnacknowledgedAccess) {
      autoOpenedPendingAccessRef.current = false;
      return;
    }
    if (
      autoOpenedPendingAccessRef.current ||
      pendingSourceId ||
      isModalOpen ||
      isManagementModalOpen ||
      isResolvingPendingAccess ||
      isLoadingRepositoriesData
    ) {
      return;
    }

    autoOpenedPendingAccessRef.current = true;
    void handleOpenManageRepositories();
    // handleOpenManageRepositories is intentionally invoked only once for the
    // current unacknowledged access state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hasUnacknowledgedAccess,
    isLoadingRepositoriesData,
    isManagementModalOpen,
    isModalOpen,
    isResolvingPendingAccess,
    pendingSourceId,
    project.id,
  ]);

  async function acknowledgePendingAccessIfPresent() {
    if (!hasUnacknowledgedAccess) {
      return;
    }
    try {
      await supervisorApi.acknowledgeProjectGitHubAccessUpdated(project.id);
    } catch {
      // Linking should still succeed even if acknowledge fails.
    }
  }

  function openRequestModal(
    status: RequestModalState["status"],
    title: string,
    message: string,
  ) {
    setRequestModal({ isOpen: true, status, title, message });
  }

  function closeRequestModal() {
    setRequestModal((current) => ({ ...current, isOpen: false }));
  }

  function startDisplayNameEdit(row: RepositoryManagementRow) {
    if (!row.linkId) {
      return;
    }
    setEditingDisplayNameRowKey(row.rowKey);
    setEditingDisplayNameDraft(row.customName ?? "");
    setDisplayNameEditError(null);
  }

  function cancelDisplayNameEdit() {
    setEditingDisplayNameRowKey(null);
    setEditingDisplayNameDraft("");
    setDisplayNameEditError(null);
  }

  async function saveDisplayNameEdit(row: RepositoryManagementRow) {
    if (!row.linkId || editingDisplayNameRowKey !== row.rowKey) {
      return;
    }

    const normalized = editingDisplayNameDraft.trim();
    if (normalized.length > 255) {
      setDisplayNameEditError("Display name must be 255 characters or less.");
      return;
    }

    setIsSavingDisplayName(true);
    setDisplayNameEditError(null);
    openRequestModal(
      "loading",
      "Updating display name",
      "Saving new display name for the repository.",
    );

    try {
      await supervisorApi.updateGitHubRepositoryDisplayName(
        row.linkId,
        normalized.length > 0 ? normalized : null,
      );
      cancelDisplayNameEdit();
      openRequestModal(
        "success",
        "Display name updated",
        "The repository display name was updated successfully.",
      );
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : "Unable to update display name right now.";
      setDisplayNameEditError(message);
      openRequestModal("error", "Update failed", message);
    } finally {
      setIsSavingDisplayName(false);
    }
  }

  function openLinkedLimitError(context: "link" | "enable") {
    if (bothLimitsReached) {
      openRequestModal(
        "error",
        "Linked and enabled limits reached",
        context === "link"
          ? "Unlink one repository to add another. To activate a newly linked repository, disable one enabled repository."
          : "Unlink one repository and disable one enabled repository before enabling another.",
      );
      return;
    }
    openRequestModal(
      "error",
      "Linked repository limit reached",
      context === "link"
        ? "Unlink one repository before adding another one."
        : "Unlink one repository before enabling a new repository.",
    );
  }

  function openEnabledLimitError() {
    openRequestModal(
      "error",
      "Enabled repository limit reached",
      "Disable one enabled repository first, then enable another.",
    );
  }

  async function loadAccessRequests() {
    setIsLoadingAccessRequests(true);
    try {
      const requests = await supervisorApi.listGitHubAccessSourceRequests(
        project.id,
      );
      setAccessRequests(requests);
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : "Unable to load GitHub access requests right now.";
      openRequestModal("error", "Access requests unavailable", message);
    } finally {
      setIsLoadingAccessRequests(false);
    }
  }

  function handleRevokeAccessRequest(requestId: string) {
    setPendingRevokeAccessRequestId(requestId);
  }

  async function confirmRevokeAccessRequest() {
    const requestId = pendingRevokeAccessRequestId;
    if (!requestId) return;
    setPendingRevokeAccessRequestId(null);
    setRevokingAccessRequestId(requestId);
    try {
      await supervisorApi.revokeGitHubAccessSourceRequest(
        project.id,
        requestId,
      );
      if (
        accessRequests.find((request) => request.id === requestId)
          ?.requestUrl === generatedAccessRequestUrl
      ) {
        setGeneratedAccessRequestUrl(null);
        setGeneratedAccessRequestExpiresAt(null);
      }
      await loadAccessRequests();
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : "Unable to revoke the access request.";
      openRequestModal("error", "Request revoke failed", message);
    } finally {
      setRevokingAccessRequestId(null);
    }
  }

  async function handleCreateAccessRequest() {
    const ownerLogin = accessRequestOwnerLogin.trim();
    if (!ownerLogin) {
      openRequestModal(
        "error",
        "GitHub owner required",
        "Enter the GitHub user or organization that should authorize the app.",
      );
      return;
    }
    setIsCreatingAccessRequest(true);
    setGeneratedAccessRequestUrl(null);
    setGeneratedAccessRequestExpiresAt(null);

    try {
      const response = await supervisorApi.createGitHubAccessSourceRequest(
        project.id,
        ownerLogin,
      );
      const absoluteUrl = new URL(
        response.requestUrl,
        window.location.origin,
      ).toString();
      setGeneratedAccessRequestUrl(absoluteUrl);
      setGeneratedAccessRequestExpiresAt(response.expiresAt ?? null);
      setAccessRequestOwnerLogin(response.ownerLogin);
      setIsAccessRequestLinkCopied(false);
      await loadAccessRequests();
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : "Unable to generate access request link right now.";
      openRequestModal("error", "Request link generation failed", message);
    } finally {
      setIsCreatingAccessRequest(false);
    }
  }

  async function handleCopyAccessRequestUrl() {
    if (!generatedAccessRequestUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedAccessRequestUrl);
      setIsAccessRequestLinkCopied(true);
      window.setTimeout(() => setIsAccessRequestLinkCopied(false), 1200);
    } catch {
      setIsAccessRequestLinkCopied(false);
      openRequestModal(
        "error",
        "Copy failed",
        "Unable to copy link automatically.",
      );
    }
  }

  async function handleStartOwnerInstall() {
    try {
      await startOwnerInstall();
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : error instanceof Error
          ? error.message
          : "Unable to start GitHub install flow right now.";
      openRequestModal("error", "GitHub install start failed", message);
    }
  }

  async function handleConfirmRepositorySelection() {
    if (!selectedSourceId) {
      openRequestModal(
        "error",
        "Missing access source",
        "Select a valid access source and try again.",
      );
      return;
    }

    if (selection.selectionsPayload.length === 0) {
      openRequestModal(
        "error",
        "No repositories selected",
        "Select at least one repository.",
      );
      return;
    }

    setIsConfirmingRepositorySelection(true);
    openRequestModal(
      "loading",
      "Linking repositories",
      "Verifying and saving the selected repositories for this project.",
    );

    try {
      await supervisorApi.linkGitHubRepositories({
        projectId: project.id,
        sourceId: selectedSourceId,
        repositories: selection.selectionsPayload,
      });
      await acknowledgePendingAccessIfPresent();
      setIsModalOpen(false);
      openRequestModal(
        "success",
        isDirectInstallationSelection
          ? "Repository linked"
          : "Repositories linked",
        isDirectInstallationSelection
          ? "The repository was linked successfully. Synchronization status is available in the project GitHub view."
          : "Selected repositories were linked successfully.",
      );
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : "Unable to link repositories right now.";
      openRequestModal("error", "Repository linking failed", message);
    } finally {
      setIsConfirmingRepositorySelection(false);
    }
  }

  async function handleSelectPrimary(linkId: string) {
    setIsMutatingLinks(true);
    openRequestModal(
      "loading",
      "Selecting repository",
      "Setting selected repository as primary.",
    );
    try {
      await supervisorApi.selectPrimaryGitHubRepository(linkId);
      openRequestModal(
        "success",
        "Primary repository updated",
        "GitHub tab now tracks the selected repository.",
      );
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : "Unable to select repository right now.";
      openRequestModal("error", "Repository selection failed", message);
    } finally {
      setIsMutatingLinks(false);
    }
  }

  async function handleRefreshRepository(linkId: string) {
    const target = linkedRepositories.find(
      (repository) => repository.id === linkId,
    );
    const syncStatus = normalizeSyncStatus(target?.syncStatus);
    if (syncStatus === "IN_PROGRESS" || syncStatus === "PENDING") {
      openRequestModal(
        "error",
        "Synchronization already active",
        "This repository already has a synchronization queued or in progress.",
      );
      return;
    }
    setIsMutatingLinks(true);
    openRequestModal(
      "loading",
      "Refreshing repository",
      "Syncing repository metadata, default-branch commits, contributors, pull requests, and reviews.",
    );
    try {
      await supervisorApi.refreshGitHubRepository(project.id, linkId);
      openRequestModal(
        "success",
        "Repository refreshed",
        "Repository synchronization has started. ResearchTrack will update the status when the background sync completes.",
      );
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : "Unable to refresh repository right now.";
      openRequestModal("error", "Repository refresh failed", message);
    } finally {
      setIsMutatingLinks(false);
    }
  }

  function handleUnlinkRepository(linkId: string) {
    const target = linkedRepositories.find(
      (repository) => repository.id === linkId,
    );
    if (target && normalizeSyncStatus(target.syncStatus) === "IN_PROGRESS") {
      openRequestModal(
        "error",
        "Repository is syncing",
        "Cannot unlink repository while sync is in progress.",
      );
      return;
    }

    setPendingUnlinkRepositoryId(linkId);
  }

  async function confirmUnlinkRepository() {
    const linkId = pendingUnlinkRepositoryId;
    if (!linkId) {
      return;
    }

    setPendingUnlinkRepositoryId(null);
    setIsMutatingLinks(true);
    openRequestModal(
      "loading",
      "Unlinking repository",
      "Removing repository from this project.",
    );
    try {
      await supervisorApi.unlinkGitHubRepository(linkId);
      openRequestModal(
        "success",
        "Repository unlinked",
        "Repository was removed from this project.",
      );
    } catch (error) {
      if (isApiException(error) && error.apiError.status === 409) {
        await reloadRepositoriesData();
        openRequestModal(
          "error",
          "Repository is syncing",
          "Cannot unlink while repository sync is in progress. Try again after sync completes.",
        );
      } else {
        const message = isApiException(error)
          ? error.apiError.message
          : "Unable to unlink repository right now.";
        openRequestModal("error", "Repository unlink failed", message);
      }
    } finally {
      setIsMutatingLinks(false);
    }
  }

  function handleDisconnectAccessSource(sourceId: string) {
    const sourceHasSyncInProgress = linkedRepositories.some(
      (repository) =>
        repository.sourceId === sourceId &&
        normalizeSyncStatus(repository.syncStatus) === "IN_PROGRESS",
    );
    if (sourceHasSyncInProgress) {
      openRequestModal(
        "error",
        "Repository is syncing",
        "Cannot disconnect access source while a repository sync is in progress.",
      );
      return;
    }
    setPendingDisconnectSourceId(sourceId);
  }

  async function confirmDisconnectAccessSource() {
    const sourceId = pendingDisconnectSourceId;
    if (!sourceId) return;
    setPendingDisconnectSourceId(null);
    setIsMutatingLinks(true);
    openRequestModal(
      "loading",
      "Disconnecting access source",
      "Removing source access and linked repositories from this project.",
    );
    try {
      await supervisorApi.disconnectGitHubAccessSource(sourceId);
      openRequestModal(
        "success",
        "Access source disconnected",
        "GitHub access source and related project links were removed.",
      );
    } catch (error) {
      if (isApiException(error) && error.apiError.status === 409) {
        await reloadRepositoriesData();
        openRequestModal(
          "error",
          "Repository is syncing",
          "Cannot disconnect this access source while a repository sync is in progress. Try again after sync completes.",
        );
      } else {
        const message = isApiException(error)
          ? error.apiError.message
          : "Unable to disconnect access source right now.";
        openRequestModal("error", "Access source disconnect failed", message);
      }
    } finally {
      setIsMutatingLinks(false);
    }
  }

  async function handleEnableRepository(row: RepositoryManagementRow) {
    if (normalizeSyncStatus(row.syncStatus) === "IN_PROGRESS") {
      openRequestModal(
        "error",
        "Repository is syncing",
        "Wait for synchronization to finish before changing repository state.",
      );
      return;
    }
    if (row.linkId) {
      if (enabledLimitReached) {
        openEnabledLimitError();
        return;
      }

      setIsMutatingLinks(true);
      openRequestModal(
        "loading",
        "Enabling repository",
        "Re-enabling repository tracking for this project.",
      );
      try {
        await supervisorApi.enableGitHubRepository(row.linkId);
        openRequestModal(
          "success",
          "Repository enabled",
          "Repository is now active for this project.",
        );
      } catch (error) {
        const message = isApiException(error)
          ? error.apiError.message
          : "Unable to enable repository right now.";
        openRequestModal("error", "Repository enable failed", message);
      } finally {
        setIsMutatingLinks(false);
      }
      return;
    }

    if (!row.sourceId || !row.githubRepositoryId) {
      openRequestModal(
        "error",
        "Repository enable failed",
        "Repository source details are missing. Reload and try again.",
      );
      return;
    }
    if (linkedLimitReached) {
      openLinkedLimitError("enable");
      return;
    }
    if (enabledLimitReached) {
      openEnabledLimitError();
      return;
    }

    setIsMutatingLinks(true);
    openRequestModal(
      "loading",
      "Enabling repository",
      "Linking repository to this project.",
    );
    try {
      await supervisorApi.linkGitHubRepositories({
        projectId: project.id,
        sourceId: row.sourceId,
        repositories: [
          {
            githubRepositoryId: row.githubRepositoryId,
            primary: enabledCount === 0,
          },
        ],
      });
      await acknowledgePendingAccessIfPresent();
      openRequestModal(
        "success",
        "Repository enabled",
        "Repository is now linked to this project.",
      );
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : "Unable to enable repository right now.";
      openRequestModal("error", "Repository enable failed", message);
    } finally {
      setIsMutatingLinks(false);
    }
  }

  function handleDisableRepository(linkId: string) {
    const target = linkedRepositories.find(
      (repository) => repository.id === linkId,
    );
    if (normalizeSyncStatus(target?.syncStatus) === "IN_PROGRESS") {
      openRequestModal(
        "error",
        "Repository is syncing",
        "Cannot disable a repository while synchronization is in progress.",
      );
      return;
    }
    setPendingDisableRepositoryId(linkId);
  }

  async function confirmDisableRepository() {
    const linkId = pendingDisableRepositoryId;
    if (!linkId) return;
    setPendingDisableRepositoryId(null);
    setIsMutatingLinks(true);
    openRequestModal(
      "loading",
      "Disabling repository",
      "Keeping link access while pausing repository sync.",
    );
    try {
      await supervisorApi.disableGitHubRepository(linkId);
      openRequestModal(
        "success",
        "Repository disabled",
        "Repository is linked but inactive. You can re-enable it later.",
      );
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : "Unable to disable repository right now.";
      openRequestModal("error", "Repository disable failed", message);
    } finally {
      setIsMutatingLinks(false);
    }
  }

  async function handleToggleRepositoryEnabled(row: RepositoryManagementRow) {
    if (row.enabled) {
      if (!row.linkId) {
        return;
      }
      await handleDisableRepository(row.linkId);
      return;
    }
    if (!row.linkId && linkedLimitReached) {
      openLinkedLimitError("enable");
      return;
    }
    if (enabledLimitReached) {
      openEnabledLimitError();
      return;
    }
    await handleEnableRepository(row);
  }

  async function handleDismissPendingAccessAlert() {
    setIsDismissingPendingAccess(true);
    try {
      await supervisorApi.acknowledgeProjectGitHubAccessUpdated(project.id);
      openRequestModal(
        "success",
        "Access update dismissed",
        "Access update alert was dismissed.",
      );
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : "Unable to dismiss access update alert right now.";
      openRequestModal("error", "Dismiss failed", message);
    } finally {
      setIsDismissingPendingAccess(false);
    }
  }

  async function handleOpenManageRepositories() {
    if (!hasUnacknowledgedAccess) {
      setIsManagementModalOpen(true);
      return;
    }

    setIsResolvingPendingAccess(true);
    openRequestModal(
      "loading",
      "Loading granted repositories",
      "Preparing repository selection for newly granted GitHub access.",
    );

    try {
      const summary = await supervisorApi.getProjectGitHubAccessUpdatedSummary(
        project.id,
      );
      const resolvedSourceId = summary.sourceId?.trim() ?? "";
      const resolvedFlowType =
        summary.flowType === "INSTALLATION_DIRECT" ||
        summary.flowType === "INSTALLATION_REQUESTED"
          ? summary.flowType
          : "INSTALLATION_REQUESTED";

      if (!resolvedSourceId) {
        closeRequestModal();
        setIsManagementModalOpen(true);
        openRequestModal(
          "error",
          "Access source not available",
          "No active access source was found for this granted access. Open manage repositories and reconnect access if needed.",
        );
        return;
      }

      closeRequestModal();
      setSelectedMethod(
        resolvedFlowType === "INSTALLATION_REQUESTED"
          ? "INSTALLATION_REQUESTED"
          : "INSTALLATION_DIRECT",
      );
      setSelectionEntryMode(
        resolvedFlowType === "INSTALLATION_REQUESTED"
          ? "callback-requested"
          : "callback-direct",
      );
      setSelectedSourceId(resolvedSourceId);
      setModalStep("repository-selection");
      setIsModalOpen(true);
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : "Unable to load newly granted repositories right now.";
      openRequestModal("error", "Failed to load granted repositories", message);
    } finally {
      setIsResolvingPendingAccess(false);
    }
  }

  return (
    <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
      <RequestStateModal
        isOpen={requestModal.isOpen}
        status={requestModal.status}
        title={requestModal.title}
        message={requestModal.message}
        onClose={
          requestModal.status === "loading" ? undefined : closeRequestModal
        }
      />

      <GithubDetailsModal
        isOpen={isModalOpen}
        title={
          isDirectInstallationSelection
            ? "Link repository"
            : "Link repositories"
        }
        onClose={() => {
          setIsModalOpen(false);
          onPendingSourceHandled?.();
        }}
      >
        <RepositoryLinkModalContent
          step={modalStep}
          repositorySelectionEntryMode={selectionEntryMode}
          canReturnToMethods={selectionEntryMode === "manual"}
          selectedMethod={selectedMethod}
          onSelectMethod={setSelectedMethod}
          onBackToMethods={() => {
            if (selectionEntryMode !== "manual") {
              return;
            }
            setModalStep("method");
            setSelectedSourceId(null);
            setSelectionEntryMode("manual");
          }}
          onStartOwnerInstall={() => void handleStartOwnerInstall()}
          isStartingOwnerInstall={isStartingOwnerInstall}
          accessRequestOwnerLogin={accessRequestOwnerLogin}
          onAccessRequestOwnerLoginChange={setAccessRequestOwnerLogin}
          onCreateAccessRequest={() => void handleCreateAccessRequest()}
          isCreatingAccessRequest={isCreatingAccessRequest}
          accessRequests={accessRequests}
          isLoadingAccessRequests={isLoadingAccessRequests}
          revokingAccessRequestId={revokingAccessRequestId}
          onReloadAccessRequests={() => void loadAccessRequests()}
          onRevokeAccessRequest={(requestId) =>
            void handleRevokeAccessRequest(requestId)
          }
          generatedAccessRequestUrl={generatedAccessRequestUrl}
          generatedAccessRequestExpiresAt={generatedAccessRequestExpiresAt}
          onCopyAccessRequestUrl={() => void handleCopyAccessRequestUrl()}
          isAccessRequestLinkCopied={isAccessRequestLinkCopied}
          selectedSourceLabel={
            selectedSource ? toSourceLabel(selectedSource) : null
          }
          availableRepositories={availableRepositoriesData?.items ?? []}
          isLoadingAvailableRepositories={isLoadingAvailableRepositories}
          availableRepositoriesError={availableRepositoriesErrorMessage}
          onReloadAvailableRepositories={() =>
            void reloadAvailableRepositories()
          }
          selectedRepositoryIds={selection.selectedRepositoryIds}
          primaryRepositoryId={selection.primaryRepositoryId}
          customNameByRepositoryId={selection.customNameByRepositoryId}
          maxSelectableCount={repositorySelectionCapacity}
          selectionLimitMessage={
            linkedLimitReached
              ? bothLimitsReached
                ? "Linked and enabled limits reached. Unlink one repository to add another. To enable another repository, disable one enabled repository."
                : "Linked repository limit reached. Unlink one repository to add another one."
              : null
          }
          onToggleRepository={selection.toggleRepository}
          onSetPrimaryRepository={selection.setPrimaryRepositoryId}
          onCustomNameChange={selection.setCustomName}
          onConfirmRepositorySelection={() =>
            void handleConfirmRepositorySelection()
          }
          isConfirmingRepositorySelection={isConfirmingRepositorySelection}
        />
      </GithubDetailsModal>

      <GithubDetailsModal
        isOpen={isManagementModalOpen}
        title="Manage repositories"
        onClose={() => setIsManagementModalOpen(false)}
      >
        <RepositoryManagementModalContent
          rows={managementRows}
          sources={managementSources}
          linkedCount={linkedCount}
          maxLinkedRepositories={maxLinkedRepositories}
          enabledCount={enabledCount}
          maxEnabledRepositories={maxEnabledRepositories}
          remainingLinkSlots={remainingLinkSlots}
          remainingEnabledSlots={remainingEnabledSlots}
          isMutating={isMutatingLinks}
          onSelectPrimary={(linkId) => void handleSelectPrimary(linkId)}
          onRefresh={(linkId) => void handleRefreshRepository(linkId)}
          onToggleEnabled={(row) => void handleToggleRepositoryEnabled(row)}
          onUnlinkRepository={(linkId) => void handleUnlinkRepository(linkId)}
          onDisconnectSource={(sourceId) =>
            void handleDisconnectAccessSource(sourceId)
          }
          isSavingDisplayName={isSavingDisplayName}
          onStartDisplayNameEdit={startDisplayNameEdit}
        />
      </GithubDetailsModal>

      <ConfirmDialog
        isOpen={pendingUnlinkRepositoryId !== null}
        title="Unlink repository?"
        description={(() => {
          const repository = linkedRepositories.find(
            (item) => item.id === pendingUnlinkRepositoryId,
          );
          const label =
            repository?.customName ||
            repository?.fullName ||
            repository?.name ||
            "this repository";
          return (
            <span>
              Unlink <strong>{label}</strong> from this ResearchTrack project?
              Existing synchronized evidence will remain in history, but it will
              no longer be attached to an active repository link.
            </span>
          );
        })()}
        confirmLabel="Unlink"
        confirmVariant="danger"
        onCancel={() => setPendingUnlinkRepositoryId(null)}
        onConfirm={() => void confirmUnlinkRepository()}
      />

      <ConfirmDialog
        isOpen={pendingDisconnectSourceId !== null}
        title="Disconnect GitHub access source?"
        description={(() => {
          const source = accessSources.find(
            (item) => item.id === pendingDisconnectSourceId,
          );
          const affectedCount = linkedRepositories.filter(
            (repository) => repository.sourceId === pendingDisconnectSourceId,
          ).length;
          return (
            <span>
              Disconnect GitHub App access for{" "}
              <strong>{source?.ownerLogin ?? "this source"}</strong>? This
              removes {affectedCount} linked repositor
              {affectedCount === 1 ? "y" : "ies"} from this ResearchTrack
              project. It does not uninstall the GitHub App from GitHub.
            </span>
          );
        })()}
        confirmLabel="Disconnect source"
        confirmVariant="danger"
        onCancel={() => setPendingDisconnectSourceId(null)}
        onConfirm={() => void confirmDisconnectAccessSource()}
      />

      <ConfirmDialog
        isOpen={pendingDisableRepositoryId !== null}
        title="Disable repository?"
        description={(() => {
          const repository = linkedRepositories.find(
            (item) => item.id === pendingDisableRepositoryId,
          );
          const label =
            repository?.customName ||
            repository?.fullName ||
            repository?.name ||
            "this repository";
          return (
            <span>
              Disable <strong>{label}</strong>? The link and synchronized
              history are kept, but new synchronization pauses until you enable
              it again.
            </span>
          );
        })()}
        confirmLabel="Disable"
        confirmVariant="danger"
        onCancel={() => setPendingDisableRepositoryId(null)}
        onConfirm={() => void confirmDisableRepository()}
      />

      <ConfirmDialog
        isOpen={pendingRevokeAccessRequestId !== null}
        title="Revoke access request?"
        description="Revoke this pending GitHub access request? The shared authorization link will stop working immediately."
        confirmLabel="Revoke request"
        confirmVariant="danger"
        onCancel={() => setPendingRevokeAccessRequestId(null)}
        onConfirm={() => void confirmRevokeAccessRequest()}
      />

      <RepositoryRenameModal
        isOpen={!!editingDisplayNameRowKey}
        draftName={editingDisplayNameDraft}
        error={displayNameEditError}
        isSaving={isSavingDisplayName}
        onChange={setEditingDisplayNameDraft}
        onSave={() => {
          const row = managementRows.find(
            (r) => r.rowKey === editingDisplayNameRowKey,
          );
          if (row) {
            void saveDisplayNameEdit(row);
          }
        }}
        onClose={cancelDisplayNameEdit}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          GitHub repositories
        </h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              className={buttonStyles({ variant: "secondary", size: "sm" })}
              onClick={() => void handleOpenManageRepositories()}
              disabled={isResolvingPendingAccess || !limitsLoaded}
            >
              {isResolvingPendingAccess || !limitsLoaded
                ? "Loading..."
                : "Manage repositories"}
            </button>
            {hasUnacknowledgedAccess && (
              <span className="absolute -right-1 -top-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
              </span>
            )}
          </div>
          {hasUnacknowledgedAccess ? (
            <button
              type="button"
              className={buttonStyles({ variant: "ghost", size: "sm" })}
              onClick={() => void handleDismissPendingAccessAlert()}
              disabled={isDismissingPendingAccess}
            >
              {isDismissingPendingAccess
                ? "Dismissing..."
                : "Dismiss access alert"}
            </button>
          ) : null}
          <button
            type="button"
            className={buttonStyles({ variant: "primary", size: "sm" })}
            onClick={() => setIsModalOpen(true)}
            disabled={!limitsLoaded || repositorySelectionCapacity < 1}
            title={
              linkedLimitReached
                ? bothLimitsReached
                  ? "Linked and enabled limits reached. Unlink one repository to continue linking."
                  : "Linked repository limit reached. Unlink one repository to continue."
                : undefined
            }
          >
            <span className="inline-flex items-center gap-2">
              <Github className="h-4 w-4" />
              Link repositories
            </span>
          </button>
        </div>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {limitsLoaded ? (
          <>
            Linked {linkedCount} / {maxLinkedRepositories} repositories ·
            Enabled {enabledCount} / {maxEnabledRepositories}.
          </>
        ) : (
          "Loading repository limits..."
        )}
      </p>

      {hasUnacknowledgedAccess ? (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-emerald-950">
                GitHub access granted
              </p>
              <p className="mt-1 text-xs leading-5 text-emerald-800">
                A GitHub App access request was completed. Choose the
                repositories to link to this project and select the primary
                repository.
              </p>
            </div>
          </div>
          <button
            type="button"
            className={buttonStyles({ variant: "primary", size: "sm" })}
            onClick={() => void handleOpenManageRepositories()}
            disabled={isResolvingPendingAccess || !limitsLoaded}
          >
            {isResolvingPendingAccess || !limitsLoaded
              ? "Loading..."
              : "Choose repositories"}
          </button>
        </div>
      ) : null}

      {isLoadingRepositoriesData ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Loading GitHub repositories...
        </p>
      ) : repositoriesDataError ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <p>{repositoriesDataError.message}</p>
          <button
            type="button"
            className={buttonStyles({
              variant: "secondary",
              size: "sm",
              className: "mt-3",
            })}
            onClick={() => void reloadRepositoriesData()}
          >
            Retry
          </button>
        </div>
      ) : null}

      {linkedRepositories.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
          <p className="text-sm text-muted-foreground">
            No GitHub repositories linked yet.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {linkedRepositories.map((repository) =>
            (() => {
              const normalizedSyncStatus = normalizeSyncStatus(
                repository.syncStatus,
              );
              const isSynced = normalizedSyncStatus === "SUCCESS";
              const isSyncing = normalizedSyncStatus === "IN_PROGRESS";
              return (
                <article
                  key={repository.id}
                  className={`rounded-2xl border p-4 transition-all duration-300 ${repository.primary ? "border-amber-200 border-l-4 border-l-amber-500 bg-amber-50/40 shadow-sm" : "border-slate-200 bg-white"} ${!repository.enabled ? "bg-slate-50/50 opacity-60 grayscale-[0.2]" : ""}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3
                          className={`truncate text-sm font-semibold ${repository.enabled ? "text-foreground" : "text-slate-600"}`}
                        >
                          {repository.customName?.trim() ||
                            repository.name ||
                            repository.fullName ||
                            "Repository"}
                        </h3>
                        {repository.primary ? (
                          <span className="inline-flex shrink-0 items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                            Primary
                          </span>
                        ) : null}
                        {!repository.enabled ? (
                          <span className="inline-flex shrink-0 items-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                            Disabled
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-500 sm:grid-cols-12 sm:gap-4">
                        {/* Repository Path */}
                        <div className="flex min-w-0 items-center gap-1.5 hover:text-foreground sm:col-span-5">
                          <Github className="h-3.5 w-3.5 shrink-0" />
                          {repository.url ? (
                            <a
                              href={repository.url}
                              target="_blank"
                              rel="noreferrer"
                              className="truncate hover:underline"
                            >
                              {repository.fullName}
                            </a>
                          ) : (
                            <span className="truncate">
                              {repository.fullName}
                            </span>
                          )}
                        </div>

                        {/* Owner */}
                        <div className="flex min-w-0 items-center sm:col-span-4">
                          <span className="truncate">
                            Owner:{" "}
                            <span className="font-medium text-slate-700">
                              {repository.ownerLogin || "unknown"}
                            </span>
                          </span>
                        </div>

                        {/* Sync Status */}
                        <div className="flex min-w-0 items-center gap-1.5 sm:col-span-3 sm:justify-end">
                          <LastSyncedBadge
                            lastSyncedAt={
                              isSynced ? repository.lastSyncedAt : null
                            }
                            fallbackText={toSyncLabel(normalizedSyncStatus)}
                            className={
                              isSynced
                                ? "bg-transparent p-0 text-[12px] text-emerald-700"
                                : isSyncing
                                  ? "bg-transparent p-0 text-[12px] text-indigo-600"
                                  : "bg-transparent p-0 text-[12px] text-slate-500"
                            }
                            iconClassName={
                              isSynced
                                ? "h-3.5 w-3.5 text-emerald-500"
                                : isSyncing
                                  ? "h-3.5 w-3.5 animate-spin text-indigo-500"
                                  : "h-3.5 w-3.5 text-slate-400"
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })(),
          )}
        </div>
      )}
    </section>
  );
}
