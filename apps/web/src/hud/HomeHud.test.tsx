import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { HomeHud } from "./HomeHud";
import { HOME_HUD_MODEL } from "./homeHudModel";

describe("HomeHud", () => {
  it("fires select, cast, and USDC callbacks", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onCast = vi.fn();
    const onUsdcChip = vi.fn();

    render(
      <HomeHud
        model={HOME_HUD_MODEL}
        selected={null}
        onSelect={onSelect}
        onCast={onCast}
        onUsdcChip={onUsdcChip}
      />,
    );

    await user.click(screen.getByTestId("choice-B"));
    expect(onSelect).toHaveBeenCalledWith("B");

    await user.click(screen.getByTestId("cast-influence"));
    expect(onCast).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId("hud-usdc"));
    expect(onUsdcChip).toHaveBeenCalledTimes(1);
  });

  it("exposes rank progress to assistive tech", () => {
    render(
      <HomeHud
        model={HOME_HUD_MODEL}
        selected="A"
        onSelect={() => undefined}
        onCast={() => undefined}
        onUsdcChip={() => undefined}
      />,
    );
    const bar = screen.getByRole("progressbar", { name: /influence rank/i });
    expect(bar.getAttribute("aria-valuenow")).toBe("1250");
    expect(bar.getAttribute("aria-valuemax")).toBe("2000");
    expect(
      screen.getByText(/vote submission is not available/i),
    ).toBeTruthy();
  });
});
