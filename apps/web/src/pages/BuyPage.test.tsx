import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DayStoreProvider } from "../day/DayStoreProvider";
import { BuyPage } from "./BuyPage";
import { App } from "../App";
import { seedOnboarded } from "../onboarding/onboardingStorage";

describe("Buy Extra Influence", () => {
  beforeEach(() => {
    seedOnboarded();
  });
  it("quotes Pulse 90/8/2, mock-buys Extra, and keeps Free separate", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/buy"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Add Extra Influence" })).toBeTruthy();
    expect(screen.getByTestId("buy-extra-value").textContent).toBe("0");
    expect(screen.getByTestId("buy-cta").textContent).toBe("Confirm buy · 5.00 USDC");
    expect(screen.getByTestId("buy-pack-pulse").getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.getByTestId("buy-you-pay").textContent).toBe("5.00 USDC");
    expect(screen.getByTestId("buy-prize-pool").textContent).toBe("4.50 USDC");
    expect(screen.getByTestId("buy-studio-net").textContent).toBe("0.40 USDC");
    expect(screen.getByTestId("buy-nova-budget").textContent).toBe("0.10 USDC");
    expect(screen.getByTestId("buy-you-receive").textContent).toBe(
      "55 Extra Influence",
    );
    expect(screen.getByTestId("buy-breakdown").getAttribute("aria-label")).toBe(
      "90% prize pool · 8% platform service fee · 2% Nova operating budget",
    );
    expect(screen.getByTestId("buy-breakdown").textContent).toMatch(/Platform service fee · 8%/);

    await user.click(screen.getByTestId("buy-cta"));
    expect(screen.getByTestId("buy-extra-value").textContent).toBe("55");
    expect(screen.getByTestId("buy-status").textContent).toMatch(
      /You received 55 Extra Influence/,
    );

    await user.click(screen.getByTestId("buy-pack-spark"));
    expect(screen.getByTestId("buy-you-pay").textContent).toBe("1.00 USDC");
    expect(screen.getByTestId("buy-prize-pool").textContent).toBe("0.90 USDC");
    expect(screen.getByTestId("buy-studio-net").textContent).toBe("0.08 USDC");
    expect(screen.getByTestId("buy-nova-budget").textContent).toBe("0.02 USDC");
    expect(screen.getByTestId("buy-you-receive").textContent).toBe(
      "10 Extra Influence",
    );
  });

  it("disables Confirm buy after 10 USDC mock spend and returns Extra to Vote", async () => {
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
    expect(screen.getByTestId("vote-screen")).toBeTruthy();
    expect(screen.getByTestId("hud-extra-value").textContent).toBe("110");
    expect(screen.getByTestId("hud-free-value").textContent).toBe("10");
    // Bought Extra lands on the Extra stepper; Free stays in its own lane.
    expect(screen.getByTestId("spend-extra-amount").textContent).toBe("110");
    expect(screen.getByTestId("spend-extra-decrease")).toHaveProperty("disabled", false);
    expect(screen.getByTestId("spend-amount").textContent).toBe("10");
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
    expect(screen.getByRole("heading", { name: "Add Extra Influence" })).toBeTruthy();

    await user.click(screen.getByTestId("buy-cta"));
    await user.click(screen.getByTestId("buy-back"));
    expect(screen.getByTestId("choice-B").getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.getByTestId("hud-extra-value").textContent).toBe("55");
  });
});

 it("disables real purchases when the selected network has no configured pool", () => {
  vi.stubEnv("VITE_WALLET_MODE", "real");
  vi.stubEnv("VITE_ARC_NETWORK", "testnet");
  vi.stubEnv("VITE_NOVA_POOL_ADDRESS", "");
  render(<MemoryRouter><DayStoreProvider><BuyPage /></DayStoreProvider></MemoryRouter>);
  expect(screen.getByTestId("buy-cta")).toHaveProperty("disabled", true);
  expect(screen.getByTestId("buy-cap").textContent).toContain("Purchases on Arc Testnet");
  expect(screen.getByTestId("buy-cap").textContent).toContain("contract has not been configured");
  expect(screen.getByTestId("buy-extra-value").textContent).toBe("0");
  vi.unstubAllEnvs();
});
