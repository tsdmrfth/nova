import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { formatCheckoutUsdc } from "../buy/buyModel";
import { seedOnboarded } from "../onboarding/onboardingStorage";
import { FakeNovaChain } from "../test/fakeChain";
import { PLAYER, renderApp } from "../test/renderApp";

const OTHER_A = "0x00000000000000000000000000000000000000a1";
const OTHER_B = "0x00000000000000000000000000000000000000b1";
const OTHER_B2 = "0x00000000000000000000000000000000000000b2";

/** A settled Day 1: B wins MOST on Free; the player picked `pick` with Free and one Spark. */
async function settledDay(pick: "A" | "B") {
  const chain = new FakeNovaChain();
  await chain.seed(OTHER_A, { option: "A", free: 4, packs: ["pulse"], extra: 55 });
  await chain.seed(OTHER_B, { option: "B", free: 10, packs: ["spark"], extra: 10 });
  await chain.seed(OTHER_B2, { option: "B", free: 10 });
  await chain.seed(PLAYER, { option: pick, free: 10, packs: ["spark"], extra: 10 });
  chain.settle();
  return chain;
}

describe("Results + claim from the pool (UI-KIT-V2 08–11)", () => {
  beforeEach(() => {
    seedOnboarded();
  });

  it("shows a matched day with the lane receipt and the onchain share", async () => {
    const chain = await settledDay("B");
    const result = await chain.readResult(1, PLAYER);
    if (!result) throw new Error("expected a settled day");
    await renderApp("/results", chain);

    // 7 USDC gross → 6.30 prize; paid lane 5.67 split 10/20 Extra, free lane 0.63 split 10/30 Free.
    expect(result.share).toEqual({ paid: 2_835_000n, free: 210_000n, total: 3_045_000n });
    const claimable = formatCheckoutUsdc(result.share.total);
    expect(screen.getByTestId("results-matched")).toBeTruthy();
    expect(screen.getByTestId("results-title").textContent).toBe("You matched!");
    expect(screen.getByTestId("results-badge").getAttribute("data-orb")).toBe("trophy");
    expect(screen.getByTestId("results-shares").textContent).toMatch(/Paid lane · 90%/);
    expect(screen.getByTestId("results-shares").textContent).toMatch(/Free lane · 10%/);
    expect(screen.getByTestId("results-claim").textContent).toBe(`Claim ${claimable} USDC`);
    expect(screen.queryByText(/SPARK/)).toBeNull();
  });

  it("walks Claim pending → USDC claimed after the next day opens", async () => {
    const chain = await settledDay("B");
    chain.openNextDay();
    chain.hold = true;
    const user = userEvent.setup();
    await renderApp("/results", chain);

    await user.click(screen.getByTestId("results-claim"));
    expect(screen.getByTestId("claim-pending")).toBeTruthy();
    expect(screen.getByTestId("claim-confirming")).toHaveProperty("disabled", true);

    chain.release();
    expect(await screen.findByTestId("claim-done")).toBeTruthy();
    expect(screen.getByTestId("claim-title").textContent).toBe("USDC claimed");
    expect((await chain.readResult(1, PLAYER))?.entry.claimed).toBe(true);

    await user.click(screen.getByTestId("claim-done-back"));
    expect(screen.getByTestId("hud-day").textContent).toBe("DAY 02");
  });

  it("shows the claimed share in Menu history on the settled day", async () => {
    const chain = await settledDay("B");
    await chain.claim(PLAYER, 1);
    const user = userEvent.setup();
    await renderApp("/", chain);
    await user.click(screen.getByTestId("hud-menu"));
    expect(screen.getByTestId("profile-claims").textContent).toBe("+3.045");

    await user.click(screen.getByTestId("menu-close"));
    await user.click(screen.getByTestId("home-cta"));
    await user.click(screen.getByTestId("confirmation-results"));
    expect(screen.getByTestId("results-claim").textContent).toBe("Claimed");
    expect(screen.getByTestId("results-claim").tagName).toBe("SPAN");
  });

  it("shows Claim didn't go through and lets the player retry", async () => {
    const chain = await settledDay("B");
    chain.failNext = "Request rejected in your wallet.";
    const user = userEvent.setup();
    await renderApp("/results", chain);

    await user.click(screen.getByTestId("results-claim"));
    expect(await screen.findByTestId("claim-failed")).toBeTruthy();
    expect(screen.getByTestId("claim-title").textContent).toBe("Claim didn't go through");
    expect(screen.getByRole("alert").textContent).toBe("Request rejected in your wallet.");

    await user.click(screen.getByTestId("claim-retry"));
    expect(await screen.findByTestId("claim-done")).toBeTruthy();
  });

  it("renders a miss as Not this round with the WINNER tag and a next-day tease", async () => {
    await renderApp("/results", await settledDay("A"));

    expect(screen.getByTestId("results-title").textContent).toBe("Not this round");
    expect(screen.getByTestId("results-badge").getAttribute("data-orb")).toBe("x");
    expect(screen.getByTestId("results-winner").textContent).toMatch(/WINNER/);
    expect(screen.getByTestId("results-pick").textContent).toMatch(/Your pick · A/);
    expect(screen.getByTestId("results-share-paid").textContent).toContain("0.00 USDC");
    expect(screen.getByTestId("results-tease").textContent).toMatch(/Chapter 02 opens tomorrow/);
    expect(screen.queryByTestId("results-claim")).toBeNull();
  });

  it("asks for a cast before any shares when the wallet sat the day out", async () => {
    const chain = new FakeNovaChain();
    await chain.seed(OTHER_B, { option: "B", free: 10 });
    chain.settle();
    const user = userEvent.setup();
    await renderApp("/results", chain);

    expect(screen.getByTestId("results-needCast")).toBeTruthy();
    expect(screen.queryByTestId("results-shares")).toBeNull();
    await user.click(screen.getByTestId("results-vote"));
    expect(screen.getByTestId("vote-screen")).toBeTruthy();
  });

  it("waits for the day to settle instead of inventing results", async () => {
    await renderApp("/results");
    expect(screen.getByTestId("results-waiting").textContent).toMatch(/once the day settles/);
  });
});
