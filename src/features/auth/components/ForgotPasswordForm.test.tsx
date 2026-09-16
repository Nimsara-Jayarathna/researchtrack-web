import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

describe("ForgotPasswordForm", () => {
  it("shows a format warning and blocks an invalid email", async () => {
    render(
      <ForgotPasswordForm
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        isLoading={false}
        onClearError={vi.fn()}
        startCooldownKey={0}
      />,
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "not-an-email@" },
    });

    expect(
      screen.getByText("Enter a valid email address."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send reset link" }),
    ).toBeDisabled();
  });

  it("allows any syntactically valid existing-account email domain", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <ForgotPasswordForm
        onSubmit={onSubmit}
        isLoading={false}
        onClearError={vi.fn()}
        startCooldownKey={0}
      />,
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "existing.user@gmail.com" },
    });

    const submit = screen.getByRole("button", { name: "Send reset link" });
    expect(submit).toBeEnabled();
    fireEvent.click(submit);
    expect(onSubmit).toHaveBeenCalledWith("existing.user@gmail.com");
  });
});
