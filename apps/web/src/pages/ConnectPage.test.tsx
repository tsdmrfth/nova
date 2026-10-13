import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { App } from "../App";
import { readDemoConfig } from "../demo/demoConfig";
import { ONBOARDING_COPY } from "../onboarding/onboardingCopy";
import {
  ONBOARDING_STORAGE_KEYS,
  seedOnboarded,
} from "../onboarding/onboardingStorage";
import { FakeNovaChain } from "../test/fakeChain";
import { PLAYER, flushChain, renderApp } from "../test/renderApp";

/** First-run visitors bring a wallet that has not approved Nova yet. */
const renderAt = (path: string, wallet: "authorized" | "fresh" = "fresh") =>
  renderApp(path, new FakeNovaChain(), { wallet });

async function connectAndAccept(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId("connect-cta"));
  await screen.findByTestId("connect-checkbox");
  await user.click(screen.getByTestId("connect-checkbox"));
  await user.click(screen.getByTestId("notice-enter"));
}

describe("onboarding first-run (UI-KIT-V2 01–04)", () => {
  it("lands first-run visitors on Connect with a single wallet CTA", async () => {
    await renderAt("/");

    expect(screen.getByRole("heading", { name: ONBOARDING_COPY.headline })).toBeTruthy();
    expect(screen.getByTestId("connect-cta").textContent).toBe(ONBOARDING_COPY.connectCta);
    expect(screen.getByTestId("connect-cta")).toHaveProperty("disabled", false);
    expect(screen.queryByText("Google")).toBeNull();
    expect(screen.getByTestId("connect-footer").textContent).toBe(ONBOARDING_COPY.footerMicro);
    expect(screen.queryByTestId("soft-launch-notice")).toBeNull();
  });

  it("shows the soft-launch notice after connect and gates Enter Nova on the checkbox", async () => {
    const user = userEvent.setup();
    await renderAt("/connect");

    await user.click(screen.getByTestId("connect-cta"));
    const notice = await screen.findByTestId("soft-launch-notice");
    expect(notice.textContent).toMatch(/Before you play/);
    expect(screen.getByTestId("connect-disclaimer").querySelectorAll("li")).toHaveLength(5);
    expect(screen.getByTestId("nova-scene-dim")).toBeTruthy();
    expect(screen.getByTestId("notice-enter")).toHaveProperty("disabled", true);
    expect(localStorage.getItem(ONBOARDING_STORAGE_KEYS.connected)).toBe("1");
    expect(localStorage.getItem(ONBOARDING_STORAGE_KEYS.disclaimerAccepted)).toBeNull();

    await user.click(screen.getByTestId("connect-checkbox"));
    expect(screen.getByTestId("notice-enter")).toHaveProperty("disabled", false);
  });

  it("enters Nova, grants +10 Free, then a skippable tutorial into Home Day 1", async () => {
    const user = userEvent.setup();
    await renderAt("/connect");
    await connectAndAccept(user);

    expect((await screen.findByTestId("grant-toast")).textContent).toMatch(/Free Influence \+10/);
    expect(screen.getByTestId("home-screen").className).toMatch(/is-behind-toast/);
    expect(localStorage.getItem(ONBOARDING_STORAGE_KEYS.disclaimerAccepted)).toBe("1");

    await user.click(screen.getByTestId("grant-toast"));
    expect(screen.getByTestId("tutorial-overlay").textContent).toMatch(/Today, the most votes wins/);

    await user.click(screen.getByTestId("tutorial-skip"));
    expect(screen.getByRole("heading", { name: "First light" })).toBeTruthy();
    expect(screen.queryByTestId("tutorial-overlay")).toBeNull();
    expect(screen.getByTestId("hud-free-value").textContent).toBe("10");
    expect(localStorage.getItem(ONBOARDING_STORAGE_KEYS.tutorialSeen)).toBe("1");
  });

  it("remembers a returning player", async () => {
    const user = userEvent.setup();
    const { unmount } = await renderAt("/connect");
    await connectAndAccept(user);
    await user.click(await screen.findByTestId("grant-toast"));
    await user.click(screen.getByTestId("tutorial-got-it"));
    unmount();

    // The wallet remembers its approval of Nova.
    await renderAt("/", "authorized");
    expect(screen.getByRole("heading", { name: "First light" })).toBeTruthy();
    expect(screen.queryByTestId("grant-toast")).toBeNull();
    expect(screen.queryByTestId("tutorial-overlay")).toBeNull();
    expect(screen.queryByTestId("connect-cta")).toBeNull();
  });

  it("brings a connected-but-unaccepted wallet back to the notice on reload", async () => {
    await renderAt("/", "authorized");
    expect(screen.getByTestId("soft-launch-notice")).toBeTruthy();
  });

  it("shows the locked geo-block copy and keeps Home closed", async () => {
    const user = userEvent.setup();
    await renderAt("/connect?edge=geo");

    expect(screen.getByTestId("geo-block").textContent).toMatch(/Not available here yet/);
    expect(screen.getByTestId("geo-block").textContent).toMatch(
      /Nova isn't available in your region yet/,
    );
    await user.click(screen.getByTestId("geo-ok"));
    expect(screen.getByTestId("geo-block")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "First light" })).toBeNull();
  });

  it("holds Home behind Switch to Arc until the wallet is on the Arc chain", async () => {
    const user = userEvent.setup();
    seedOnboarded();
    let chainHex = "0x1";
    const request = vi.fn(async ({ method, params }: { method: string; params?: unknown[] }) => {
      if (method === "eth_accounts" || method === "eth_requestAccounts") return [PLAYER];
      if (method === "eth_chainId") return chainHex;
      if (method === "wallet_switchEthereumChain") chainHex = (params?.[0] as { chainId: string }).chainId;
      return null;
    });
    vi.stubGlobal("ethereum", { request, on: vi.fn(), removeListener: vi.fn() });
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App chain={new FakeNovaChain()} />
      </MemoryRouter>,
    );
    await flushChain();

    expect(screen.getByTestId("network-block").textContent).toMatch(/Nova runs on Arc/);
    expect(screen.queryByTestId("home-screen")).toBeNull();
    await user.click(screen.getByTestId("network-switch"));
    expect(chainHex).toBe(readDemoConfig().chainHex);
    expect(await screen.findByTestId("home-screen")).toBeTruthy();
  });

  it("keeps seeded returning users on Home without the tutorial", async () => {
    seedOnboarded();
    await renderAt("/", "authorized");
    expect(screen.getByRole("heading", { name: "First light" })).toBeTruthy();
    expect(screen.queryByTestId("tutorial-overlay")).toBeNull();
    expect(screen.queryByTestId("grant-toast")).toBeNull();
  });
});
