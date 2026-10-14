import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { SupervisorDashboard } from "../../types";
import { PAGE_SIZE } from "../../utils/dashboard/constants";
import {
  computeAttentionProjects,
  computeUpcomingProjects,
  type AttentionItem,
  type UpcomingMilestoneItem,
} from "../../utils/dashboard/scoring";

type SupervisorDashboardViewModel = {
  query: string;
  statusFilter: string;
  sortMode: string;
  setSortMode: (value: string) => void;
  setStatusFilter: (value: string) => void;
  setQuery: (value: string) => void;
  currentPage: number;
  setCurrentPage: (value: number | ((page: number) => number)) => void;
  normalizedQuery: string;
  projects: SupervisorDashboard["projects"];
  visibleProjects: SupervisorDashboard["projects"];
  totalPages: number;
  safeCurrentPage: number;
  pagedProjects: SupervisorDashboard["projects"];
  pageSize: number;
  attentionProjects: AttentionItem[];
  upcomingProjects: UpcomingMilestoneItem[];
};

export function useSupervisorDashboardViewModel(
  dashboard: SupervisorDashboard | null,
) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortMode, setSortMode] = useState("default");
  const [currentPage, setCurrentPage] = useState(1);

  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const pageSize = PAGE_SIZE;

  const projects = useMemo(
    () => dashboard?.projects ?? [],
    [dashboard?.projects],
  );

  const visibleProjects = useMemo(() => {
    const matched = projects.filter((project) => {
      const matchesStatus =
        statusFilter === "ALL" || project.lifecycleStatus === statusFilter;
      const matchesSearch =
        normalizedQuery.length === 0 ||
        `${project.title} ${project.summary ?? ""} ${project.lifecycleStatus}`
          .toLowerCase()
          .includes(normalizedQuery);
      return matchesStatus && matchesSearch;
    });
    if (sortMode === "name")
      return [...matched].sort((a, b) => a.title.localeCompare(b.title));
    if (sortMode === "progress")
      return [...matched].sort(
        (a, b) => (b.progressPercent ?? -1) - (a.progressPercent ?? -1),
      );
    if (sortMode === "risk") {
      const priority: Record<string, number> = {
        BEHIND: 0,
        AT_RISK: 1,
        PLANNING: 2,
        ACTIVE: 3,
        COMPLETED: 4,
      };
      return [...matched].sort(
        (a, b) =>
          (priority[a.lifecycleStatus] ?? 9) -
          (priority[b.lifecycleStatus] ?? 9),
      );
    }
    return matched;
  }, [projects, normalizedQuery, statusFilter, sortMode]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(visibleProjects.length / pageSize));
  }, [visibleProjects.length, pageSize]);

  const safeCurrentPage = useMemo(() => {
    return Math.min(currentPage, totalPages);
  }, [currentPage, totalPages]);

  const pagedProjects = useMemo(() => {
    return visibleProjects.slice(
      (safeCurrentPage - 1) * pageSize,
      safeCurrentPage * pageSize,
    );
  }, [pageSize, safeCurrentPage, visibleProjects]);

  useEffect(() => {
    setCurrentPage(1);
  }, [normalizedQuery, statusFilter, sortMode]);

  const now = useMemo(() => new Date(), []);
  const attentionProjects = useMemo(
    () => computeAttentionProjects(projects, now),
    [now, projects],
  );
  const upcomingProjects = useMemo(
    () => computeUpcomingProjects(projects, now),
    [now, projects],
  );

  const viewModel: SupervisorDashboardViewModel = {
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    sortMode,
    setSortMode,
    currentPage,
    setCurrentPage,
    normalizedQuery,
    projects,
    visibleProjects,
    totalPages,
    safeCurrentPage,
    pagedProjects,
    pageSize,
    attentionProjects,
    upcomingProjects,
  };

  return viewModel;
}
