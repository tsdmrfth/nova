import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "../App";
import { formatCheckoutUsdc } from "../buy/buyModel";
import { castSelected, createDayState, selectChoice } from "../day/dayStore";
import { CLAIM_CONFIRM_MS } from "../day/DayStoreProvider";
import { seedOnboarded } from "../onboarding/onboardingStorage";
import { settleOffline } from "../results/settleMock";

const settleWait = { timeout: CLAIM_CONFIRM_MS + 1500 };

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

async function castAndOpenResults(user: ReturnType<typeof userEvent.setup>, pick: "A" | "B") {
  renderAt("/vote");
  await user.click(screen.getByTestId(`choice-${pick}`));
  await user.click(screen.getByTestId("cast-influence"));
  await user.click(screen.getByTestId("confirmation-results"));
}

describe("Results + claim (UI-KIT-V2 08–11)", () => {
  beforeEach(() => {
    seedOnboarded();
  });

  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("settles a correct cast as matched with the lane receipt and a claim CTA", async () => {
    const user = userEvent.setup();
    await castAndOpenResults(user, "B");

    const expected = settleOffline(
      castSelected(selectChoice(createDayState(1, new Date("2026-09-18T12:00:00")), "B")),
    );
    const claimable = formatCheckoutUsdc(expected.player.total);

    expect(screen.getByTestId("results-matched")).toBeTruthy();
    expect(screen.getByTestId("results-title").textContent).toBe("You matched!");
    expect(screen.getByTestId("results-badge").getAttribute("data-orb")).toBe("trophy");
    expect(screen.getByTestId("results-shares").textContent).toMatch(/Paid lane · 90%/);
    expect(screen.getByTestId("results-shares").textContent).toMatch(/Free lane · 10%/);
    expect(screen.getByTestId("results-share-free").textContent).toContain(claimable);
    expect(screen.getByTestId("results-claim").textContent).toBe(`Claim ${claimable} USDC`);
    expect(screen.queryByText(/SPARK/)).toBeNull();
  });

  it("walks Claim pending → USDC claimed → Claimed chip, and records it in Menu history", async () => {
    const user = userEvent.setup();
    await castAndOpenResults(user, "B");

    await user.click(screen.getByTestId("results-claim"));
    expect(screen.getByTestId("claim-pending")).toBeTruthy();
    expect(screen.getByTestId("claim-confirming")).toHaveProperty("disabled", true);

    await waitFor(() => expect(screen.getByTestId("claim-done")).toBeTruthy(), settleWait);
    expect(screen.getByTestId("claim-title").textContent).toBe("USDC claimed");

    await user.click(screen.getByTestId("claim-done-back"));
    await user.click(screen.getByTestId("hud-menu"));
    expect(screen.getByTestId("profile-claims").textContent).toMatch(/^\+/);
    await user.click(screen.getByTestId("menu-close"));

    await user.click(screen.getByTestId("home-cta"));
    await user.click(screen.getByTestId("confirmation-results"));
    expect(screen.getByTestId("results-claim").textContent).toBe("Claimed");
    expect(screen.getByTestId("results-claim").tagName).toBe("SPAN");
  });

  it("shows Claim didn't go through and lets the player retry (?claim=fail)", async () => {
    window.history.replaceState(null, "", "/?claim=fail");
    const user = userEvent.setup();
    await castAndOpenResults(user, "B");

    await user.click(screen.getByTestId("results-claim"));
    await waitFor(() => expect(screen.getByTestId("claim-failed")).toBeTruthy(), settleWait);
    expect(screen.getByTestId("claim-title").textContent).toBe("Claim didn't go through");

    await user.click(screen.getByTestId("claim-retry"));
    expect(screen.getByTestId("claim-pending")).toBeTruthy();
  });

  it("renders a miss as Not this round with the WINNER tag and a next-day tease", async () => {
    const user = userEvent.setup();
    await castAndOpenResults(user, "A");

    expect(screen.getByTestId("results-title").textContent).toBe("Not this round");
    expect(screen.getByTestId("results-badge").getAttribute("data-orb")).toBe("x");
    expect(screen.getByTestId("results-winner").textContent).toMatch(/WINNER/);
    expect(screen.getByTestId("results-pick").textContent).toMatch(/Your pick · A/);
    expect(screen.getByTestId("results-share-paid").textContent).toContain("0.00 USDC");
    expect(screen.getByTestId("results-tease").textContent).toMatch(/Chapter 02 opens tomorrow/);
    expect(screen.queryByTestId("results-claim")).toBeNull();
  });

  it("asks for a cast before any shares on an empty day", async () => {
    const user = userEvent.setup();
    renderAt("/results");

    expect(screen.getByTestId("results-needCast")).toBeTruthy();
    expect(screen.queryByTestId("results-shares")).toBeNull();
    await user.click(screen.getByTestId("results-vote"));
    expect(screen.getByTestId("vote-screen")).toBeTruthy();
  });
});
