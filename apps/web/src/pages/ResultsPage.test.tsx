import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatUsdc } from "@nova/shared";
import { App } from "../App";
import { seedOnboarded } from "../onboarding/onboardingStorage";
import { settleOffline } from "../results/settleMock";
import {
  buyPack,
  castSelected,
  createDayState,
  selectChoice,
} from "../day/dayStore";

vi.mock("../scene/HomeSceneHost", () => ({
  HomeSceneHost: () => <div data-testid="scene-stage" />,
}));

describe("Results + Profile mock loop", () => {
  beforeEach(() => {
    seedOnboarded();
  });
  it("settles a correct Expand cast with Free share, SPARK, and claim CTA", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/vote"]}>
        <App />
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId("choice-B"));
    await user.click(screen.getByTestId("cast-influence"));
    await user.click(screen.getByText("Menu"));
    await user.click(screen.getByRole("link", { name: "Results" }));

    const expected = settleOffline(
      castSelected(selectChoice(createDayState(1, new Date("2026-09-18T12:00:00")), "B")),
    );

    expect(screen.getByTestId("results-canon").textContent).toBe(
      "Canon today: Say hello",
    );
    expect(screen.getByTestId("results-goal").textContent).toBe("Day goal was MOST");
    expect(screen.getByTestId("results-hook").textContent).toBe(
      "Neighbors notice a wave.",
    );
    expect(screen.getByTestId("results-world").textContent).toMatch(/Expand/i);
    expect(screen.getByTestId("results-share-free").textContent).toBe(
      `Free pool: ${formatUsdc(expected.player.free)} USDC`,
    );
    expect(screen.queryByTestId("results-share-paid")).toBeNull();
    expect(screen.getByTestId("results-spark").textContent).toMatch(/\+20/);
    expect(screen.getByTestId("results-claim").textContent).toMatch(
      new RegExp(`Claim ${formatUsdc(expected.player.total)} USDC`),
    );

    await user.click(screen.getByTestId("results-claim"));
    expect(screen.getByTestId("results-claim").textContent).toBe("Claimed");
    expect(screen.getByTestId("results-claim")).toHaveProperty("disabled", true);

    await user.click(screen.getByText("Menu"));
    await user.click(screen.getByRole("link", { name: "Profile" }));
    expect(screen.getByTestId("profile-casts").textContent).toMatch(/Say hello/);
    expect(screen.getByTestId("profile-claims").textContent).toMatch(/USDC/);
    expect(screen.queryByTestId("results-claim")).toBeNull();
    expect(screen.queryByRole("button", { name: /claim/i })).toBeNull();
  });

  it("shows paid + free lines after a Pulse buy on the winner", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/buy"]}>
        <App />
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId("buy-cta"));
    await user.click(screen.getByTestId("buy-back"));
    await user.click(screen.getByTestId("choice-B"));
    await user.click(screen.getByTestId("cast-influence"));
    await user.click(screen.getByText("Menu"));
    await user.click(screen.getByRole("link", { name: "Results" }));

    const seeded = castSelected(
      selectChoice(
        buyPack(createDayState(1, new Date("2026-09-18T12:00:00")), "pulse"),
        "B",
      ),
    );
    const expected = settleOffline(seeded);

    expect(screen.getByTestId("results-share-paid").textContent).toBe(
      `Paid pool: ${formatUsdc(expected.player.paid)} USDC`,
    );
    expect(screen.getByTestId("results-share-free").textContent).toBe(
      `Free pool: ${formatUsdc(expected.player.free)} USDC`,
    );
    expect(screen.getByTestId("results-claim").textContent).toMatch(
      new RegExp(`Claim ${formatUsdc(expected.player.total)} USDC`),
    );
  });

  it("misses Stabilize against MOST Expand and keeps Profile history-only", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId("choice-A"));
    await user.click(screen.getByTestId("cast-influence"));
    await user.click(screen.getByText("Menu"));
    await user.click(screen.getByRole("link", { name: "Results" }));

    expect(screen.getByTestId("results-miss").textContent).toBe("No pool share today");
    expect(screen.queryByTestId("results-claim")).toBeNull();
    expect(screen.getByTestId("results-spark").textContent).toMatch(/\+5/);

    await user.click(screen.getByTestId("results-back"));
    expect(screen.getByRole("heading", { name: "First light" })).toBeTruthy();
  });

  it("names the Round 02 canon from the story pack on a LEAST day", () => {
    render(
      <MemoryRouter initialEntries={["/results?day=2"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("results-canon").textContent).toBe(
      "Canon today: Ask the deadline",
    );
    expect(screen.getByTestId("results-goal").textContent).toBe("Day goal was LEAST");
    expect(screen.getByTestId("results-world").textContent).toMatch(/Stabilize/);
    expect(screen.queryByTestId("results-hook")).toBeNull();
  });

  it("shows the empty Profile copy before any cast", async () => {
    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("profile-empty").textContent).toMatch(
      /No casts yet/,
    );
    expect(screen.queryByRole("button", { name: /claim/i })).toBeNull();
  });
});
