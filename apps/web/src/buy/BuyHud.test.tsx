import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createDayState } from "../day/dayStore";
import { BuyHud } from "./BuyHud";
import { buildBuyModel } from "./buyModel";

const now = new Date("2026-09-18T12:00:00");

describe("BuyHud", () => {
  it("selects Spark and fires mock buy / back callbacks", async () => {
    const user = userEvent.setup();
    const onSelectPack = vi.fn();
    const onBuy = vi.fn();
    const onBack = vi.fn();
    const model = buildBuyModel(createDayState(1, now), "pulse");

    render(
      <BuyHud
        model={model}
        selectedPackId="pulse"
        onSelectPack={onSelectPack}
        onBuy={onBuy}
        onBack={onBack}
      />,
    );

    expect(screen.getByRole("heading", { name: "Extra Influence" })).toBeTruthy();
    expect(screen.getByTestId("buy-pack-pulse").getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.getByText("Most chosen")).toBeTruthy();
    expect(screen.getByTestId("buy-you-pay").textContent).toBe("5.00 USDC");
    expect(screen.getByTestId("buy-prize-pool").textContent).toBe("4.50 USDC");
    expect(screen.getByTestId("buy-studio-net").textContent).toBe("0.40 USDC");
    expect(screen.getByTestId("buy-nova-budget").textContent).toBe("0.10 USDC");

    await user.click(screen.getByTestId("buy-pack-spark"));
    expect(onSelectPack).toHaveBeenCalledWith("spark");

    await user.click(screen.getByTestId("buy-cta"));
    expect(onBuy).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId("buy-back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("keeps Buy with USDC disabled when the model says so", () => {
    const model = {
      ...buildBuyModel(createDayState(1, now), "pulse"),
      ctaEnabled: false,
      ctaDisabledReason: "Daily Extra buy cap applies.",
    };
    render(
      <BuyHud
        model={model}
        selectedPackId="pulse"
        onSelectPack={() => undefined}
        onBuy={() => undefined}
        onBack={() => undefined}
      />,
    );
    expect(screen.getByTestId("buy-cta")).toHaveProperty("disabled", true);
    expect(screen.getByTestId("buy-cap").textContent).toMatch(/Daily Extra buy cap/);
  });
});
