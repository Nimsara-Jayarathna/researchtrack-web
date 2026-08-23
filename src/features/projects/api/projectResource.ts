import { toVersionedApiPath } from "@/app/config/apiVersion";
import type { ProjectGitHubPreview } from "../types";
import type { UserRole } from "@/types/roles";

export const PROJECTS_RESOURCE_PATH = toVersionedApiPath("/api/projects");
export const STUDENT_DIRECTORY_PATH = toVersionedApiPath("/api/users/students");

export type ProjectResourceUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  registrationNumber: string | null;
};

export type ProjectResourceMember = ProjectResourceUser & {
  memberRole: UserRole;
};

export type ProjectResourceMilestone = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "MISSED" | "CANCELLED";
  sequenceNo: number;
};

export type ProjectResourceSummary = {
  id: string;
  title: string;
  summary: string;
  lifecycleStatus: "PLANNING" | "ACTIVE" | "AT_RISK" | "BEHIND" | "COMPLETED";
  batch: string;
  semester: string;
  milestoneDate: string | null;
  lastActivityAt: string | null;
  progressPercent: number;
  memberCount: number;
  supervisorName: string | null;
};

export type ProjectResourceDetail = {
  id: string;
  title: string;
  summary: string;
  lifecycleStatus: ProjectResourceSummary["lifecycleStatus"];
  batch: string;
  semester: string;
  milestoneDate: string | null;
  lastActivityAt: string | null;
  progressPercent: number;
  supervisor: ProjectResourceUser | null;
  leader: ProjectResourceUser | null;
  members: ProjectResourceMember[];
  milestones: ProjectResourceMilestone[];
};

export function createEmptyProjectGitHubPreview(): ProjectGitHubPreview {
  return {
    repositoryLinked: false,
    repositories: [],
    primaryRepositoryUrl: null,
    activitySummary: {
      totalCommits: 0,
      lastActivityAt: null,
      status: "idle",
    },
    contributorsPreview: [],
    recentCommitsPreview: [],
  };
}
