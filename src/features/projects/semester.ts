export const SEMESTER_OPTIONS = ["Semester 1", "Semester 2"] as const;

export type SemesterOption = (typeof SEMESTER_OPTIONS)[number];

export function isValidSemester(semester: string): semester is SemesterOption {
  return SEMESTER_OPTIONS.some((option) => option === semester);
}
