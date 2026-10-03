import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { seedOnboarded } from "../onboarding/onboardingStorage";
import { FakeNovaChain } from "../test/fakeChain";
import { PLAYER, renderApp } from "../test/renderApp";

describe("Buy Extra Influence", () => {
  beforeEach(() => {
    seedOnboarded();
  });
  it("quotes Pulse 90/8/2, buys onchain, and keeps Free separate", async () => {
    const user = userEvent.setup();
    const { chain } = await renderApp("/buy");

    expect(screen.getByRole("heading", { name: "Add Extra Influence" })).toBeTruthy();
    expect(screen.getByTestId("buy-extra-value").textContent).toBe("0");
    expect(screen.getByTestId("buy-cta").textContent).toBe("Confirm buy · 5.00 USDC");
    expect(screen.getByTestId("buy-pack-pulse").getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.getByTestId("buy-you-pay").textContent).toBe("5.00 USDC");
    expect(screen.getByTestId("buy-prize-pool").textContent).toBe("4.50 USDC");
    expect(screen.getByTestId("buy-studio-net").textContent).toBe("0.40 USDC");
    expect(screen.getByTestId("buy-nova-budget").textContent).toBe("0.10 USDC");
    expect(screen.getByTestId("buy-you-receive").textContent).toBe(
      "55 Extra Influence",
    );
    expect(screen.getByTestId("buy-breakdown").getAttribute("aria-label")).toBe(
      "90% prize pool · 8% platform service fee · 2% Nova operating budget",
    );
    expect(screen.getByTestId("buy-breakdown").textContent).toMatch(/Platform service fee · 8%/);

    await user.click(screen.getByTestId("buy-cta"));
    expect((await screen.findByTestId("buy-status")).textContent).toMatch(
      /You received 55 Extra Influence/,
    );
    expect(screen.getByTestId("buy-extra-value").textContent).toBe("55");
    expect(screen.getByText("View confirmed purchase").getAttribute("href")).toMatch(
      /^https:\/\/explorer\.test\/tx\/0x/,
    );
    expect(await chain.readDay(PLAYER)).toMatchObject({ spentMicro: 5_000_000n, entry: { extraBought: 55 } });

    await user.click(screen.getByTestId("buy-pack-spark"));
    expect(screen.getByTestId("buy-you-pay").textContent).toBe("1.00 USDC");
    expect(screen.getByTestId("buy-prize-pool").textContent).toBe("0.90 USDC");
    expect(screen.getByTestId("buy-studio-net").textContent).toBe("0.08 USDC");
    expect(screen.getByTestId("buy-nova-budget").textContent).toBe("0.02 USDC");
    expect(screen.getByTestId("buy-you-receive").textContent).toBe(
      "10 Extra Influence",
    );
  });

  it("disables Confirm buy after 10 USDC spent today and returns Extra to Vote", async () => {
    const user = userEvent.setup();
    const chain = new FakeNovaChain();
    await chain.buy(PLAYER, "pulse");
    await renderApp("/buy", chain);
    expect(screen.getByTestId("buy-extra-value").textContent).toBe("55");

    await user.click(screen.getByTestId("buy-cta"));
    await screen.findByTestId("buy-status");
    expect(screen.getByTestId("buy-extra-value").textContent).toBe("110");
    expect(screen.getByTestId("buy-cta")).toHaveProperty("disabled", true);

    await user.click(screen.getByTestId("buy-back"));
    expect(screen.getByTestId("vote-screen")).toBeTruthy();
    expect(screen.getByTestId("hud-extra-value").textContent).toBe("110");
    expect(screen.getByTestId("hud-free-value").textContent).toBe("10");
    // Bought Extra lands on the Extra stepper; Free stays in its own lane.
    expect(screen.getByTestId("spend-extra-amount").textContent).toBe("110");
    expect(screen.getByTestId("spend-extra-decrease")).toHaveProperty("disabled", false);
    expect(screen.getByTestId("spend-amount").textContent).toBe("10");
  });

  it("opens Buy from the Vote Extra prompt and keeps the selected tile", async () => {
    const user = userEvent.setup();
    await renderApp("/vote");

    await user.click(screen.getByTestId("choice-B"));
    expect(screen.getByTestId("buy-entry").textContent).toMatch(
      /Need more Extra Influence/,
    );
    await user.click(screen.getByTestId("buy-entry"));
    expect(screen.getByRole("heading", { name: "Add Extra Influence" })).toBeTruthy();

    await user.click(screen.getByTestId("buy-cta"));
    await screen.findByTestId("buy-status");
    await user.click(screen.getByTestId("buy-back"));
    expect(screen.getByTestId("choice-B").getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.getByTestId("hud-extra-value").textContent).toBe("55");
  });

  it("keeps Confirm buy off while the wallet confirms, then shows a rejection", async () => {
    const user = userEvent.setup();
    const chain = new FakeNovaChain();
    chain.hold = true;
    chain.failNext = "Not enough USDC. Get test USDC at faucet.circle.com, then try again.";
    await renderApp("/buy", chain);
    await user.click(screen.getByTestId("buy-cta"));
    expect(screen.getByTestId("buy-cta")).toHaveProperty("disabled", true);
    expect(screen.getByText(/Confirm in your wallet/)).toBeTruthy();
    chain.release();
    expect((await screen.findByText(/faucet\.circle\.com/)).textContent).toMatch(/Not enough USDC/);
    expect(screen.getByTestId("buy-extra-value").textContent).toBe("0");
  });

  it("disables purchases when the selected network has no configured pool", async () => {
    vi.stubEnv("VITE_ARC_NETWORK", "testnet");
    await renderApp("/buy", null);
    expect(screen.getByTestId("buy-cta")).toHaveProperty("disabled", true);
    expect(screen.getByTestId("buy-cap").textContent).toContain("Purchases on Arc Testnet");
    expect(screen.getByTestId("buy-cap").textContent).toContain("contract has not been configured");
    expect(screen.getByTestId("buy-extra-value").textContent).toBe("0");
    vi.unstubAllEnvs();
  });

  it("closes Buy once the pool day has settled", async () => {
    const chain = new FakeNovaChain();
    chain.settle();
    await renderApp("/buy", chain);
    expect(screen.getByTestId("buy-cta")).toHaveProperty("disabled", true);
    expect(screen.getByTestId("buy-cap").textContent).toMatch(/round is closed/);
  });
});
