import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import type { ReactNode } from "react";
import { LandingPage } from "./LandingPage";

const { getRegisterConfigMock } = vi.hoisted(() => ({
  getRegisterConfigMock: vi.fn(),
}));

vi.mock("@/features/auth/api/authApi", () => ({ authApi: { getRegisterConfig: getRegisterConfigMock } }));
vi.mock("@/app/layout/PublicLayout", () => ({
  PublicLayout: ({ onRegister, onLogin, children }: { onRegister: () => void; onLogin: () => void; children: ReactNode }) => (
    <div><button type="button" onClick={onRegister}>Header registration</button><button type="button" onClick={onLogin}>Header sign in</button>{children}</div>
  ),
}));
vi.mock("@/features/auth/components/LoginPanel", () => ({ LoginPanel: () => <div>login-panel</div> }));
vi.mock("@/features/auth/components/registration/RegistrationPanel", () => ({ RegistrationPanel: () => <div>registration-panel</div> }));

const registrationConfig = {
  domainRestrictionEnabled: true,
  studentDomain: "@my.sliit.lk",
  supervisorDomain: "@sliit.lk",
  studentEmailPrefixRestrictionEnabled: true,
  studentEmailPrefixRegex: "^IT",
};

function mount(props: Parameters<typeof LandingPage>[0] = {}) {
  return render(<MemoryRouter><LandingPage {...props} /></MemoryRouter>);
}

describe("LandingPage public experience", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("communicates supported capabilities and accurate setup ownership", () => {
    mount();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Complete visibility");
    expect(screen.getByText("Spot what needs attention")).toBeInTheDocument();
    expect(screen.getByText("Close the feedback loop")).toBeInTheDocument();
    expect(screen.getByText("Supervisor-led project setup")).toBeInTheDocument();
    expect(screen.getAllByText(/fictional sample data/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/students register their research project/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/milestones align with development tasks automatically/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/legal/privacy");
    expect(screen.getByRole("link", { name: "Support" })).toHaveAttribute("href", "/support");
  });

  it("opens registration from hero after fetching current registration configuration", async () => {
    getRegisterConfigMock.mockResolvedValue(registrationConfig);
    const user = userEvent.setup(); mount();
    await user.click(screen.getAllByRole("button", { name: /get started/i })[0]);
    expect(await screen.findByText("registration-panel")).toBeInTheDocument();
    expect(getRegisterConfigMock).toHaveBeenCalledTimes(1);
  });

  it("opens login via the final CTA", async () => {
    const user = userEvent.setup(); mount();
    await user.click(screen.getAllByRole("button", { name: /sign in/i }).slice(-1)[0]);
    expect(screen.getByText("login-panel")).toBeInTheDocument();
  });

  it("handles direct registration routes without losing config gating", async () => {
    getRegisterConfigMock.mockResolvedValue(registrationConfig);
    mount({ initialRegistrationOpen: true });
    expect(await screen.findByText("registration-panel")).toBeInTheDocument();
    expect(getRegisterConfigMock).toHaveBeenCalledTimes(1);
  });

  it("blocks registration and allows retry after a configuration failure", async () => {
    const user = userEvent.setup();
    getRegisterConfigMock.mockRejectedValueOnce(new Error("network failure")).mockResolvedValueOnce(registrationConfig);
    mount();
    await user.click(screen.getByRole("button", { name: "Header registration" }));
    expect(await screen.findByText("Service temporarily unavailable")).toBeInTheDocument();
    expect(screen.queryByText("registration-panel")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(await screen.findByText("registration-panel")).toBeInTheDocument();
    await waitFor(() => expect(getRegisterConfigMock).toHaveBeenCalledTimes(2));
  });
});
