import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { grantDailyFree } from "@nova/shared";
import { seedOnboarded } from "../onboarding/onboardingStorage";
import { FakeNovaChain } from "../test/fakeChain";
import { flushChain, renderApp } from "../test/renderApp";

const renderAt = (path: string, chain = new FakeNovaChain(), wallet: "authorized" | "fresh" = "authorized") =>
  renderApp(path, chain, { wallet });

describe("Vote locked + onchain day loop (UI-KIT-V2 07)", () => {
  beforeEach(() => {
    seedOnboarded();
  });

  it("keeps a cold /confirmation deep link from inventing a cast", async () => {
    const user = userEvent.setup();
    await renderAt("/confirmation");

    expect(screen.getByRole("heading", { name: "Nothing locked yet" })).toBeTruthy();
    expect(screen.getByTestId("confirmation-empty").textContent).toMatch(/Cast Influence/);
    expect(screen.queryByTestId("confirmation-choice")).toBeNull();
    expect(screen.getByTestId("confirmation-free").textContent).toMatch(
      new RegExp(`Free spent0Remaining${grantDailyFree()}`),
    );
    expect(screen.getByTestId("confirmation-close").textContent).toBe("At settle");
    expect(screen.queryByTestId("confirmation-results")).toBeNull();

    await user.click(screen.getByTestId("confirmation-home"));
    expect(screen.getByRole("heading", { name: "First light" })).toBeTruthy();
    expect(screen.getByTestId("hud-free-value").textContent).toBe(String(grantDailyFree()));
    expect(screen.getByTestId("home-cta").textContent).toMatch(/^Choose and vote/);
  });

  it("plays Connect → Home → Vote → Buy → Vote locked → settle → Results on one day", async () => {
    const user = userEvent.setup();
    window.localStorage.clear();
    const chain = new FakeNovaChain();
    // Other players: B leads the Free tally, so MOST picks B.
    await chain.seed("0x00000000000000000000000000000000000000a1", { option: "A", free: 4 });
    await chain.seed("0x00000000000000000000000000000000000000b1", { option: "B", free: 10, packs: ["spark"], extra: 10 });
    await renderAt("/connect", chain, "fresh");

    await user.click(screen.getByTestId("connect-cta"));
    await screen.findByTestId("connect-checkbox");
    await user.click(screen.getByTestId("connect-checkbox"));
    await user.click(screen.getByTestId("notice-enter"));
    await user.click(screen.getByTestId("grant-toast"));
    await user.click(screen.getByTestId("tutorial-got-it"));

    await user.click(screen.getByTestId("choice-B"));
    await user.click(screen.getByTestId("buy-entry"));
    await user.click(screen.getByTestId("buy-pack-spark"));
    await user.click(screen.getByTestId("buy-cta"));
    await screen.findByTestId("buy-status");
    await user.click(screen.getByTestId("buy-back"));

    expect(screen.getByTestId("choice-B").getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("spend-extra-amount").textContent).toBe("10");
    await user.click(screen.getByTestId("spend-extra-decrease"));
    await user.click(screen.getByTestId("cast-influence"));

    expect((await screen.findByTestId("confirmation-title")).textContent).toBe("Vote locked");
    expect(within(screen.getByTestId("confirmation-choice")).getByText("Say hello")).toBeTruthy();
    expect(screen.getByTestId("confirmation-free").textContent).toBe(
      "Free spent10Remaining0",
    );
    expect(screen.getByTestId("confirmation-extra").textContent).toBe(
      "Extra spent9Remaining1",
    );
    expect(screen.getByTestId("confirmation-back").textContent).toBe(
      "Back to vote · View only",
    );

    await user.click(screen.getByTestId("confirmation-back"));
    expect(screen.getByTestId("cast-influence").textContent).toBe("Vote locked · view");
    expect(screen.getByTestId("choice-A")).toHaveProperty("disabled", true);
    await user.click(screen.getByTestId("cast-influence"));

    // Results stay shut until the owner settles the day onchain.
    expect(screen.getByTestId("confirmation-results")).toHaveProperty("disabled", true);
    chain.settle();
    window.dispatchEvent(new Event("focus"));
    await flushChain();
    expect(screen.getByTestId("confirmation-results")).toHaveProperty("disabled", false);
    await user.click(screen.getByTestId("confirmation-results"));
    expect((await screen.findByTestId("results-title")).textContent).toBe("You matched!");
    expect(screen.getByTestId("results-pick").textContent).toMatch(/Your pick · B/);
  });

  it("sends an unseen visitor to Connect", async () => {
    window.localStorage.clear();
    await renderAt("/confirmation", new FakeNovaChain(), "fresh");
    expect(screen.getByTestId("connect-cta")).toBeTruthy();
  });
});
