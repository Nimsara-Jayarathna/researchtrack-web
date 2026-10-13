import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { LandingHeader } from "./LandingHeader";

describe("LandingHeader", () => {
  it("opens and closes the responsive menu and navigates to sections", async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn();
    const onRegister = vi.fn();
    render(<MemoryRouter><LandingHeader onLogin={onLogin} onRegister={onRegister} /></MemoryRouter>);
    const toggle = screen.getByRole("button", { name: "Open navigation menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(screen.getByRole("button", { name: "Close navigation menu" })).toHaveAttribute("aria-expanded", "true");
    const mobile = screen.getByRole("navigation", { name: "Mobile landing page navigation" });
    expect(mobile.querySelector('a[href="#features"]')).toBeTruthy();
    await user.click(within(mobile).getByRole("button", { name: "Get started" }));
    expect(onRegister).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("navigation", { name: "Mobile landing page navigation" })).not.toBeInTheDocument();
  });
});
