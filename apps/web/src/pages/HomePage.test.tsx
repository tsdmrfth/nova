import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../App";
import { seedOnboarded } from "../onboarding/onboardingStorage";

vi.mock("../scene/HomeSceneHost", () => ({
  HomeSceneHost: () => <div data-testid="scene-stage" />,
}));

describe("Home / Vote cast shell", () => {
  beforeEach(() => {
    seedOnboarded();
  });
  it("casts Free Influence on Home and keeps the cinema shell", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "First light" })).toBeTruthy();
    expect(screen.getByTestId("cast-influence")).toHaveProperty("disabled", true);

    await user.click(screen.getByTestId("choice-A"));
    await user.click(screen.getByTestId("cast-influence"));

    expect(screen.getByRole("heading", { name: "First light" })).toBeTruthy();
    expect(screen.getByTestId("scene-stage")).toBeTruthy();
    expect(screen.getByTestId("cast-status").textContent).toMatch(/Influence cast/i);
    expect(screen.getByTestId("hud-free-value").textContent).toBe("0");
  });

  it("shares the in-memory day store with the Vote route", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId("choice-C"));
    await user.click(screen.getByTestId("spend-decrease"));
    await user.click(screen.getByTestId("cast-influence"));
    expect(screen.getByTestId("hud-free-value").textContent).toBe("1");

    await user.click(screen.getByText("Menu"));
    await user.click(screen.getByRole("link", { name: "Vote" }));

    expect(screen.getByRole("heading", { name: "First light" })).toBeTruthy();
    expect(screen.getByTestId("day-goal").textContent).toMatch(/MOST/);
    expect(screen.getByTestId("cast-status").textContent).toMatch(/Influence cast/i);
    expect(screen.getByTestId("choice-C").getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.getByText("Route")).toBeTruthy();
    expect(screen.getByText("Find your place")).toBeTruthy();
  });

  it("opens the Vote cinema shell from the compact menu", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    await user.click(screen.getByText("Menu"));
    await user.click(screen.getByRole("link", { name: "Vote" }));
    expect(screen.getByRole("heading", { name: "First light" })).toBeTruthy();
    expect(screen.getByTestId("cast-influence")).toBeTruthy();
  });

  it("renders a later round from the day query without copying strings into the HUD", async () => {
    render(
      <MemoryRouter initialEntries={["/?day=10"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "First promise" })).toBeTruthy();
    expect(screen.getByTestId("day-goal").textContent).toMatch(/MOST/);
    expect(screen.getByText("Check first")).toBeTruthy();
    expect(screen.getByText("Say yes more")).toBeTruthy();
    expect(screen.getByText("Promise the path")).toBeTruthy();
    expect(screen.getByText("Stabilize")).toBeTruthy();
    expect(screen.getByText("Expand")).toBeTruthy();
    expect(screen.getByText("Route")).toBeTruthy();
    expect(screen.getByTestId("cast-influence").textContent).toMatch(/Cast Influence/);
    expect(document.body.textContent).not.toMatch(/ask_first|protect_money/);
    expect(document.body.textContent).not.toMatch(/non-binding but impactful/);
    expect(document.body.textContent).toMatch(
      /Not affiliated with Circle's Architects program/,
    );
  });

  it("opens Extra Influence from the USDC chip", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId("hud-usdc"));
    expect(screen.getByRole("heading", { name: "Extra Influence" })).toBeTruthy();
    expect(screen.getByTestId("buy-cta")).toBeTruthy();
  });
});
