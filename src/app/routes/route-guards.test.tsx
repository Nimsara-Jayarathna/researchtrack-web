import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { clearInMemoryAuthState, setAuthenticatedUser } from "@/features/auth/state/authState";
import { RequireRole } from "./route-guards";

function renderSupervisorRoute() {
  return render(
    <MemoryRouter initialEntries={["/supervisor/projects"]}>
      <Routes>
        <Route element={<RequireRole role="SUPERVISOR" />}>
          <Route
            path="/supervisor/projects"
            element={<div>Supervisor projects</div>}
          />
        </Route>
        <Route path="/student/projects" element={<div>Student projects</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("role guards", () => {
  beforeEach(() => {
    clearInMemoryAuthState();
  });

  it("allows a supervisor to render supervisor-only UI", () => {
    setAuthenticatedUser({
      id: "supervisor-id",
      email: "supervisor@sliit.lk",
      firstName: "Supervisor",
      lastName: "User",
      role: "SUPERVISOR",
    });

    renderSupervisorRoute();
    expect(screen.getByText("Supervisor projects")).toBeInTheDocument();
  });

  it("redirects a student away from supervisor-only UI", () => {
    setAuthenticatedUser({
      id: "student-id",
      email: "it24100487@my.sliit.lk",
      firstName: "Student",
      lastName: "User",
      role: "STUDENT",
    });

    renderSupervisorRoute();
    expect(screen.queryByText("Supervisor projects")).not.toBeInTheDocument();
    expect(screen.getByText("Student projects")).toBeInTheDocument();
  });
});
