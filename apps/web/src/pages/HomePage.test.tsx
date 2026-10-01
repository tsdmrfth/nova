import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "../App";
import { PREF_KEYS } from "../menu/prefs";
import { seedOnboarded } from "../onboarding/onboardingStorage";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("Home / Vote (UI-KIT-V2 05–06)", () => {
  beforeEach(() => {
    seedOnboarded();
  });

  it("renders the story on Home and opens Vote with the tapped card preselected", async () => {
    const user = userEvent.setup();
    renderAt("/");

    expect(screen.getByTestId("hud-day").textContent).toBe("DAY 01");
    expect(screen.getByTestId("day-goal").textContent).toBe("GOAL · MOST");
    expect(screen.getByRole("heading", { name: "First light" })).toBeTruthy();
    expect(screen.getByTestId("home-cta").textContent).toMatch(/^Choose and vote · closes /);
    expect(screen.queryByTestId("spend-split")).toBeNull();
    expect(screen.queryByTestId("hud-usdc")).toBeNull();

    await user.click(screen.getByTestId("choice-C"));
    expect(screen.getByTestId("vote-screen")).toBeTruthy();
    expect(screen.getByTestId("choice-C").getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("cast-influence").textContent).toBe("Cast Influence on C");
  });

  it("casts on Vote with two separate steppers, then locks the day", async () => {
    const user = userEvent.setup();
    renderAt("/vote");

    expect(screen.getByTestId("cast-influence")).toHaveProperty("disabled", true);
    await user.click(screen.getByTestId("choice-B"));
    expect(screen.getByTestId("spend-amount").textContent).toBe("10");
    await user.click(screen.getByTestId("spend-decrease"));
    expect(screen.getByTestId("spend-amount").textContent).toBe("9");
    expect(within(screen.getByTestId("spend-free")).getByText("1 left of 10")).toBeTruthy();
    expect(screen.getByTestId("spend-extra-increase")).toHaveProperty("disabled", true);

    await user.click(screen.getByTestId("cast-influence"));
    expect(screen.getByTestId("confirmation-title").textContent).toBe("Vote locked");

    await user.click(screen.getByTestId("confirmation-home"));
    expect(screen.getByTestId("home-cta").textContent).toBe("View your vote");
    expect(screen.getByTestId("hud-free-value").textContent).toBe("1");
  });

  it("opens Buy from the EXTRA balance chip", async () => {
    const user = userEvent.setup();
    renderAt("/");
    await user.click(screen.getByTestId("hud-extra"));
    expect(screen.getByRole("heading", { name: "Add Extra Influence" })).toBeTruthy();
  });

  it("opens the Menu from the MENU chip and closes it again", async () => {
    const user = userEvent.setup();
    renderAt("/");

    await user.click(screen.getByTestId("hud-menu"));
    const menu = screen.getByTestId("menu-sheet");
    expect(within(menu).getByText("Day history")).toBeTruthy();
    expect(screen.getByTestId("profile-empty")).toBeTruthy();
    expect(screen.getByTestId("nova-scene-dim")).toBeTruthy();

    await user.click(screen.getByTestId("menu-close"));
    expect(screen.queryByTestId("menu-sheet")).toBeNull();
  });

  it("persists Calm motion and applies it app-wide", async () => {
    const user = userEvent.setup();
    renderAt("/");
    await user.click(screen.getByTestId("hud-menu"));

    const calm = screen.getByTestId("menu-calm");
    expect(calm.getAttribute("aria-checked")).toBe("false");
    await user.click(calm);
    expect(calm.getAttribute("aria-checked")).toBe("true");
    expect(localStorage.getItem(PREF_KEYS.calmMotion)).toBe("1");
    expect(document.documentElement.dataset.calm).toBe("true");

    await user.click(calm);
    expect(document.documentElement.dataset.calm).toBeUndefined();
  });

  it("reopens the tutorial and the read-only notice from Help", async () => {
    const user = userEvent.setup();
    renderAt("/");

    await user.click(screen.getByTestId("hud-menu"));
    await user.click(screen.getByTestId("menu-help-notice"));
    expect(screen.getByTestId("soft-launch-notice")).toBeTruthy();
    expect(screen.queryByTestId("connect-checkbox")).toBeNull();
    await user.click(screen.getByTestId("notice-close"));

    await user.click(screen.getByTestId("menu-help-tutorial"));
    expect(screen.queryByTestId("menu-sheet")).toBeNull();
    expect(screen.getByTestId("tutorial-overlay")).toBeTruthy();
  });

  it("disconnects back to Connect", async () => {
    const user = userEvent.setup();
    renderAt("/");
    await user.click(screen.getByTestId("hud-menu"));
    await user.click(screen.getByTestId("menu-disconnect"));
    expect(screen.getByTestId("connect-cta")).toBeTruthy();
  });

  it("redirects the retired /profile route Home", () => {
    renderAt("/profile");
    expect(screen.getByTestId("home-screen")).toBeTruthy();
  });
});
