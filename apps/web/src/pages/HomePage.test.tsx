import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { App } from "../App";

vi.mock("../scene/HomeSceneHost", () => ({
  HomeSceneHost: () => <div data-testid="scene-stage" />,
}));

describe("Home / Vote cast shell", () => {
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
