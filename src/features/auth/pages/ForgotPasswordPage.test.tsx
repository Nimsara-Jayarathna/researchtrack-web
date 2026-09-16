import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { ForgotPasswordPage } from "./ForgotPasswordPage";

vi.mock("@/features/auth/api/authApi", () => ({
  authApi: {
    forgotPassword: vi.fn(),
  },
}));

vi.mock("@/features/landing", () => ({
  LandingPage: () => <div>landing</div>,
}));

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without depending on registration configuration", () => {
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send reset link" }),
    ).toBeDisabled();
  });
});
