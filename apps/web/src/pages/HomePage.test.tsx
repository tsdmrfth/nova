import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { PREF_KEYS } from "../menu/prefs";
import { seedOnboarded } from "../onboarding/onboardingStorage";
import { FakeNovaChain } from "../test/fakeChain";
import { PLAYER, renderApp } from "../test/renderApp";

const renderAt = (path: string, chain = new FakeNovaChain()) => renderApp(path, chain);

describe("Home / Vote (UI-KIT-V2 05–06)", () => {
  beforeEach(() => {
    seedOnboarded();
  });

  it("opens day 2 with the line day 1's winner wrote", async () => {
    const chain = new FakeNovaChain();
    await chain.seed("0x00000000000000000000000000000000000000a1", { option: "A", free: 10 });
    chain.settle();
    chain.openNextDay();
    await renderAt("/", chain);

    expect(screen.getByTestId("hud-day").textContent).toBe("DAY 02");
    expect(screen.getByTestId("day-goal").textContent).toBe("GOAL · LEAST");
    expect(screen.getByRole("heading", { name: "First task" })).toBeTruthy();
    expect(screen.getByTestId("hud-scene").textContent).toMatch(/stayed quiet/i);
    expect(screen.getByTestId("hud-scene").textContent).toMatch(/today's plan/i);
    expect(screen.getByTestId("choice-A").textContent).toMatch(/Ask the deadline/);
    expect(
      screen.getByTestId("hud-bar-Stabilize").querySelector("[role='progressbar']")?.getAttribute("aria-valuenow"),
    ).toBe("1");
    expect(
      screen.getByTestId("hud-bar-Expand").querySelector("[role='progressbar']")?.getAttribute("aria-valuenow"),
    ).toBe("0");
  });

  it("renders the story on Home and opens Vote with the tapped card preselected", async () => {
    const user = userEvent.setup();
    await renderAt("/");

    expect(screen.getByTestId("hud-day").textContent).toBe("DAY 01");
    expect(screen.getByTestId("day-goal").textContent).toBe("GOAL · MOST");
    expect(screen.getByRole("heading", { name: "First light" })).toBeTruthy();
    expect(screen.getByTestId("home-cta").textContent).toBe("Choose and vote");
    expect(screen.queryByTestId("spend-split")).toBeNull();
    expect(screen.queryByTestId("hud-usdc")).toBeNull();

    await user.click(screen.getByTestId("choice-C"));
    expect(screen.getByTestId("vote-screen")).toBeTruthy();
    expect(screen.getByTestId("choice-C").getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("cast-influence").textContent).toBe("Cast Influence on C");
  });

  it("casts on Vote with two separate steppers, then locks the day", async () => {
    const user = userEvent.setup();
    await renderAt("/vote");

    expect(screen.getByTestId("cast-influence")).toHaveProperty("disabled", true);
    await user.click(screen.getByTestId("choice-B"));
    expect(screen.getByTestId("spend-amount").textContent).toBe("10");
    await user.click(screen.getByTestId("spend-decrease"));
    expect(screen.getByTestId("spend-amount").textContent).toBe("9");
    expect(within(screen.getByTestId("spend-free")).getByText("1 left of 10")).toBeTruthy();
    expect(screen.getByTestId("spend-extra-increase")).toHaveProperty("disabled", true);

    await user.click(screen.getByTestId("cast-influence"));
    expect((await screen.findByTestId("confirmation-title")).textContent).toBe("Vote locked");

    await user.click(screen.getByTestId("confirmation-home"));
    expect(screen.getByTestId("home-cta").textContent).toBe("View your vote");
    expect(screen.getByTestId("hud-free-value").textContent).toBe("1");
  });

  it("writes the vote to the pool and reads it back after a reload", async () => {
    const chain = new FakeNovaChain();
    const user = userEvent.setup();
    const first = await renderAt("/vote", chain);
    await user.click(screen.getByTestId("choice-A"));
    await user.click(screen.getByTestId("cast-influence"));
    await screen.findByTestId("confirmation-title");
    expect((await chain.readDay(PLAYER)).entry).toMatchObject({ voted: true, option: "A", free: 10 });

    first.unmount();
    await renderAt("/", chain);
    expect(screen.getByTestId("home-cta").textContent).toBe("View your vote");
    expect(screen.getByTestId("hud-free-value").textContent).toBe("0");
  });

  it("shows the pool's rejection and stays on Vote", async () => {
    const chain = new FakeNovaChain();
    chain.failNext = "Request rejected in your wallet.";
    const user = userEvent.setup();
    await renderAt("/vote", chain);
    await user.click(screen.getByTestId("choice-B"));
    await user.click(screen.getByTestId("cast-influence"));
    expect((await screen.findByRole("alert")).textContent).toBe("Request rejected in your wallet.");
    expect(screen.getByTestId("vote-screen")).toBeTruthy();
    expect((await chain.readDay(PLAYER)).entry.voted).toBe(false);
  });

  it("sends a closed day to Results instead of Vote", async () => {
    const chain = new FakeNovaChain();
    chain.settle();
    const user = userEvent.setup();
    await renderAt("/", chain);
    expect(screen.getByTestId("home-cta").textContent).toBe("Voting closed · see results");
    await user.click(screen.getByTestId("home-cta"));
    expect(screen.getByTestId("results-screen")).toBeTruthy();
  });

  it("opens Buy from the EXTRA balance chip", async () => {
    const user = userEvent.setup();
    await renderAt("/");
    await user.click(screen.getByTestId("hud-extra"));
    expect(screen.getByRole("heading", { name: "Add Extra Influence" })).toBeTruthy();
  });

  it("opens the Menu from the MENU chip and closes it again", async () => {
    const user = userEvent.setup();
    await renderAt("/");

    await user.click(screen.getByTestId("hud-menu"));
    const menu = screen.getByTestId("menu-sheet");
    expect(within(menu).getByText("Day history")).toBeTruthy();
    expect(screen.getByTestId("profile-empty")).toBeTruthy();
    expect(screen.getByTestId("menu-scrim")).toBeTruthy();

    await user.click(screen.getByTestId("menu-close"));
    expect(screen.queryByTestId("menu-sheet")).toBeNull();

    await user.click(screen.getByTestId("hud-menu"));
    await user.click(screen.getByTestId("menu-scrim"));
    expect(screen.queryByTestId("menu-sheet")).toBeNull();
  });

  it("persists Calm motion and applies it app-wide", async () => {
    const user = userEvent.setup();
    await renderAt("/");
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
    await renderAt("/");

    await user.click(screen.getByTestId("hud-menu"));
    await user.click(screen.getByTestId("menu-help-notice"));
    expect(screen.getByTestId("soft-launch-notice")).toBeTruthy();
    expect(screen.queryByTestId("connect-checkbox")).toBeNull();
    await user.click(screen.getByTestId("notice-close"));

    await user.click(screen.getByTestId("menu-help-tutorial"));
    expect(screen.queryByTestId("menu-sheet")).toBeNull();
    expect(screen.getByTestId("tutorial-overlay")).toBeTruthy();
    // The overlay covers the HUD too, so the scene-only dim stays off.
    expect(screen.getByTestId("frame-overlay-scrim")).toBeTruthy();
    expect(screen.queryByTestId("nova-scene-dim")).toBeNull();
    expect(screen.getByTestId("tutorial-layer").classList.contains("nv-overlay--rise")).toBe(true);
  });

  it("slides the tutorial back down before closing it", async () => {
    const calls: { el: Element; to: string; anim: { onfinish: (() => void) | null } }[] = [];
    HTMLElement.prototype.animate = function animate(this: HTMLElement, keyframes: Keyframe[]) {
      const anim = { onfinish: null };
      calls.push({ el: this, to: String(keyframes[1].transform), anim });
      return anim as unknown as Animation;
    } as HTMLElement["animate"];
    try {
      const user = userEvent.setup();
      await renderAt("/");
      await user.click(screen.getByTestId("hud-menu"));
      calls.length = 0;
      await user.click(screen.getByTestId("menu-help-tutorial"));
      // The Menu pulls back up first; the tutorial opens when that finishes.
      act(() => calls.at(-1)?.anim.onfinish?.());
      calls.length = 0;

      await user.click(screen.getByTestId("tutorial-got-it"));
      const layer = screen.getByTestId("tutorial-layer");
      expect(calls.map(({ el, to }) => [el, to])).toEqual([[layer, "translate3d(0, 100%, 0)"]]);
      expect(layer.classList.contains("is-leaving")).toBe(true);

      act(() => calls[0].anim.onfinish?.());
      expect(screen.queryByTestId("tutorial-overlay")).toBeNull();
      expect(screen.queryByTestId("frame-overlay-scrim")).toBeNull();
    } finally {
      delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
    }
  });

  it("shows the tutorial without the rise under Calm motion", async () => {
    localStorage.setItem(PREF_KEYS.calmMotion, "1");
    const user = userEvent.setup();
    await renderAt("/");

    await user.click(screen.getByTestId("hud-menu"));
    await user.click(screen.getByTestId("menu-help-tutorial"));
    expect(screen.getByTestId("frame-overlay-scrim")).toBeTruthy();
    expect(screen.getByTestId("tutorial-layer").classList.contains("nv-overlay--rise")).toBe(false);
    await user.click(screen.getByTestId("tutorial-skip"));
    expect(screen.queryByTestId("tutorial-overlay")).toBeNull();
  });

  it("opens the full guide from Help and comes back Home", async () => {
    const user = userEvent.setup();
    await renderAt("/");

    await user.click(screen.getByTestId("hud-menu"));
    await user.click(screen.getByTestId("menu-help-guide"));
    expect(screen.getByRole("heading", { name: "How Nova works" })).toBeTruthy();
    expect(screen.getByTestId("guide-nova").textContent).toMatch(/Nova operating budget/);

    // The goal tabs open on today's goal (Day 1 is MOST) and mark the example winner.
    expect(screen.getByTestId("guide-goal-MOST").getAttribute("aria-selected")).toBe("true");
    expect(screen.getByTestId("guide-goal-panel").textContent).toMatch(/most votes wins.*A.*WINNER/s);
    await user.click(screen.getByTestId("guide-goal-LEAST"));
    expect(screen.getByTestId("guide-goal-panel").textContent).toMatch(/fewest votes wins/);
    expect(screen.getByTestId("guide-goal-panel").textContent).toMatch(/C210WINNER/);

    // The first chip starts selected; tapping one selects it.
    expect(screen.getByTestId("guide-jump-day").getAttribute("aria-current")).toBe("true");
    await user.click(screen.getByTestId("guide-jump-pool"));
    expect(screen.getByTestId("guide-jump-pool").getAttribute("aria-current")).toBe("true");
    expect(screen.getByTestId("guide-jump-day").getAttribute("aria-current")).toBeNull();

    await user.click(screen.getByTestId("guide-back"));
    expect(screen.getByTestId("home-screen")).toBeTruthy();
  });

  it("disconnects back to Connect", async () => {
    const user = userEvent.setup();
    await renderAt("/");
    await user.click(screen.getByTestId("hud-menu"));
    await user.click(screen.getByTestId("menu-disconnect"));
    expect(screen.getByTestId("connect-cta")).toBeTruthy();
  });

  it("redirects the retired /profile route Home", async () => {
    await renderAt("/profile");
    expect(screen.getByTestId("home-screen")).toBeTruthy();
  });
});
