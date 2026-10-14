import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../App";
import { seedOnboarded } from "../onboarding/onboardingStorage";

const ADDRESS = "0xF2FDeE747478A34deaf79811A4f87581dc01bBBD";
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

function renderReal() {
  vi.stubEnv("VITE_ARC_NETWORK", "testnet");
  return render(<MemoryRouter initialEntries={["/"]}><App /></MemoryRouter>);
}

describe("real Connect route", () => {
  it("fresh visitor with no disclaimer sees the connect screen", async () => {
    // No seedOnboarded — fresh localStorage → disclaimer not accepted → /connect
    vi.stubGlobal("ethereum", undefined);
    renderReal();
    expect(await screen.findByTestId("connect-cta")).toBeTruthy();
    expect(screen.queryByTestId("home-screen")).toBeNull();
  });

  it("player who accepted disclaimer bypasses connect and lands on home", async () => {
    seedOnboarded();
    vi.stubGlobal("ethereum", undefined);
    renderReal();
    // disclaimer accepted → isOnboarded true → PlayGate passes → home renders
    expect(await screen.findByTestId("home-screen")).toBeTruthy();
    expect(screen.queryByTestId("connect-cta")).toBeNull();
  });

  it("shows the soft-launch notice after wallet approval on first run", async () => {
    let accounts: string[] = [];
    vi.stubGlobal("ethereum", { request: vi.fn(async ({ method }: { method: string }) => {
      if (method === "eth_requestAccounts") accounts = [ADDRESS];
      if (method === "eth_accounts" || method === "eth_requestAccounts") return accounts;
      if (method === "eth_chainId") return "0x4cef52";
      return null;
    }) });
    renderReal();
    await userEvent.click(await screen.findByTestId("connect-cta"));
    expect(await screen.findByTestId("soft-launch-notice")).toBeTruthy();
    expect(screen.getByTestId("connected-wallet").textContent).toBe(ADDRESS);
    expect(screen.getByTestId("notice-enter")).toHaveProperty("disabled", true);
  });
});
