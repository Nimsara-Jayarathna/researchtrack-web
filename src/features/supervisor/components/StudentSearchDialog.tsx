import type { ApiError } from "@/types";
import type { SearchState } from "../projectDetails.shared";
import type { SupervisorStudentSearchResult } from "../types";

type StudentSearchDialogProps = {
  query: string;
  onQueryChange: (query: string) => void;
  searchState: SearchState;
  searchError: ApiError | null;
  searchResults: SupervisorStudentSearchResult[];
  onSelectStudent: (student: SupervisorStudentSearchResult) => void;
  selectedStudents: SupervisorStudentSearchResult[];
  onRemoveSelected: (studentId: string) => void;
  onAdd: () => void;
  onCancel: () => void;
  isLoading: boolean;
};

export function StudentSearchDialog({
  query,
  onQueryChange,
  searchState,
  searchError,
  searchResults,
  onSelectStudent,
  selectedStudents,
  onRemoveSelected,
  onAdd,
  onCancel,
  isLoading,
}: StudentSearchDialogProps) {
  return (
    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="mb-4">
        <h4 className="font-semibold text-slate-900">
          Add Students
        </h4>

        <p className="mt-1 text-sm text-slate-500">
          Search for students by name, email, or registration number.
        </p>
      </div>

      <input
        type="text"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search students..."
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />

      {query.trim().length > 0 && query.trim().length < 3 && (
        <p className="mt-2 text-xs text-slate-500">
          Enter at least 3 characters to search.
        </p>
      )}

      {searchState === "loading" && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-500">
          Searching students...
        </div>
      )}

      {searchState === "error" && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {searchError?.message ?? "Unable to search students."}
        </div>
      )}

      {searchState === "empty" && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-500">
          No students found.
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="mt-3 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white">
          {searchResults.map((student) => (
            <button
              key={student.id}
              type="button"
              onClick={() => onSelectStudent(student)}
              className="block w-full border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50"
            >
              <p className="font-medium text-slate-900">
                {student.firstName ?? ""} {student.lastName ?? ""}
              </p>

              <p className="text-sm text-slate-500">
                {student.email}
              </p>

              {student.registrationNumber && (
                <p className="text-xs text-slate-400">
                  {student.registrationNumber}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {selectedStudents.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-slate-700">
            Selected Students
          </p>

          <div className="space-y-2">
            {selectedStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {student.firstName ?? ""} {student.lastName ?? ""}
                  </p>

                  <p className="text-xs text-slate-500">
                    {student.email}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveSelected(student.id)}
                  className="text-sm font-medium text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={onAdd}
          disabled={isLoading || selectedStudents.length === 0}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Adding..." : "Add Students"}
        </button>
      </div>
    </div>
  );
}