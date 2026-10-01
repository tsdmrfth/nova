import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";
import { grantDailyFree } from "@nova/shared";
import { App } from "../App";
import { seedOnboarded } from "../onboarding/onboardingStorage";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("Vote locked + offline day loop (UI-KIT-V2 07)", () => {
  beforeEach(() => {
    seedOnboarded();
  });

  it("keeps a cold /confirmation deep link from inventing a cast", async () => {
    const user = userEvent.setup();
    renderAt("/confirmation");

    expect(screen.getByRole("heading", { name: "Nothing locked yet" })).toBeTruthy();
    expect(screen.getByTestId("confirmation-empty").textContent).toMatch(/Cast Influence/);
    expect(screen.queryByTestId("confirmation-choice")).toBeNull();
    expect(screen.getByTestId("confirmation-free").textContent).toMatch(
      new RegExp(`Free spent0Remaining${grantDailyFree()}`),
    );
    expect(screen.getByTestId("confirmation-close").textContent).toMatch(/\d{2}:\d{2}/);
    expect(screen.queryByTestId("confirmation-results")).toBeNull();

    await user.click(screen.getByTestId("confirmation-home"));
    expect(screen.getByRole("heading", { name: "First light" })).toBeTruthy();
    expect(screen.getByTestId("hud-free-value").textContent).toBe(String(grantDailyFree()));
    expect(screen.getByTestId("home-cta").textContent).toMatch(/^Choose and vote/);
  });

  it("plays Connect → Home → Vote → Buy → Vote locked → Results on one day", async () => {
    const user = userEvent.setup();
    window.localStorage.clear();
    renderAt("/connect");

    await user.click(screen.getByTestId("connect-cta"));
    await user.click(screen.getByTestId("connect-checkbox"));
    await user.click(screen.getByTestId("notice-enter"));
    await user.click(screen.getByTestId("grant-toast"));
    await user.click(screen.getByTestId("tutorial-got-it"));

    await user.click(screen.getByTestId("choice-B"));
    await user.click(screen.getByTestId("buy-entry"));
    await user.click(screen.getByTestId("buy-pack-spark"));
    await user.click(screen.getByTestId("buy-cta"));
    await user.click(screen.getByTestId("buy-back"));

    expect(screen.getByTestId("choice-B").getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("spend-extra-amount").textContent).toBe("10");
    await user.click(screen.getByTestId("spend-extra-decrease"));
    await user.click(screen.getByTestId("cast-influence"));

    expect(screen.getByTestId("confirmation-title").textContent).toBe("Vote locked");
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

    await user.click(screen.getByTestId("confirmation-results"));
    expect(screen.getByTestId("results-title").textContent).toBe("You matched!");
    expect(screen.getByTestId("results-pick").textContent).toMatch(/Your pick · B/);
  });

  it("sends an unseen visitor to Connect", () => {
    window.localStorage.clear();
    renderAt("/confirmation");
    expect(screen.getByTestId("connect-cta")).toBeTruthy();
  });
});
