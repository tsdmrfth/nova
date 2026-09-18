import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { App } from "../App";

vi.mock("../scene/HomeSceneHost", () => ({
  HomeSceneHost: () => <div data-testid="scene-stage" />,
}));

describe("Buy Extra Influence", () => {
  it("quotes Pulse 90/10, mock-buys Extra, and keeps Free separate", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/buy"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Extra Influence" })).toBeTruthy();
    expect(screen.getByTestId("buy-free-value").textContent).toBe("10");
    expect(screen.getByTestId("buy-extra-value").textContent).toBe("0");
    expect(screen.getByTestId("buy-pack-pulse").getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.getByTestId("buy-you-pay").textContent).toBe("5.00 USDC");
    expect(screen.getByTestId("buy-prize-pool").textContent).toBe("4.50 USDC");
    expect(screen.getByTestId("buy-studio-fee").textContent).toBe("0.50 USDC");
    expect(screen.getByTestId("buy-you-receive").textContent).toBe(
      "55 Extra Influence",
    );
    expect(screen.getByText("90% prize pool · 10% platform service fee")).toBeTruthy();

    await user.click(screen.getByTestId("buy-cta"));
    expect(screen.getByTestId("buy-extra-value").textContent).toBe("55");
    expect(screen.getByTestId("buy-free-value").textContent).toBe("10");
    expect(screen.getByTestId("buy-status").textContent).toMatch(
      /You received 55 Extra Influence/,
    );

    await user.click(screen.getByTestId("buy-pack-spark"));
    expect(screen.getByTestId("buy-you-pay").textContent).toBe("1.00 USDC");
    expect(screen.getByTestId("buy-prize-pool").textContent).toBe("0.90 USDC");
    expect(screen.getByTestId("buy-studio-fee").textContent).toBe("0.10 USDC");
    expect(screen.getByTestId("buy-you-receive").textContent).toBe(
      "10 Extra Influence",
    );
  });

  it("disables Buy with USDC after 10 USDC mock spend and returns Extra to Vote", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/buy"]}>
        <App />
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId("buy-cta"));
    await user.click(screen.getByTestId("buy-cta"));
    expect(screen.getByTestId("buy-extra-value").textContent).toBe("110");
    expect(screen.getByTestId("buy-cta")).toHaveProperty("disabled", true);

    await user.click(screen.getByTestId("buy-back"));
    expect(screen.getByRole("heading", { name: "First light" })).toBeTruthy();
    expect(screen.getByTestId("hud-extra-value").textContent).toBe("110");
    expect(screen.getByTestId("hud-free-value").textContent).toBe("10");
    expect(screen.getByTestId("choice-A")).toBeTruthy();
  });

  it("opens Buy from the Vote Extra prompt and keeps the selected tile", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/vote"]}>
        <App />
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId("choice-B"));
    expect(screen.getByTestId("buy-entry").textContent).toMatch(
      /Need more Extra Influence/,
    );
    await user.click(screen.getByTestId("buy-entry"));
    expect(screen.getByRole("heading", { name: "Extra Influence" })).toBeTruthy();

    await user.click(screen.getByTestId("buy-cta"));
    await user.click(screen.getByTestId("buy-back"));
    expect(screen.getByTestId("choice-B").getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.getByTestId("hud-extra-value").textContent).toBe("55");
  });
});
