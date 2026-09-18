import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createDayState, selectChoice } from "../day/dayStore";
import { HomeHud } from "./HomeHud";
import { buildHudModel } from "./homeHudModel";

const now = new Date("2026-09-18T12:00:00");
const openState = createDayState(1, now);
const selectedState = selectChoice(openState, "B");
const openModel = buildHudModel(openState, {
  A: "tile_stabilize",
  B: "tile_expand",
  C: "tile_route",
});
const selectedModel = buildHudModel(selectedState, {
  A: "tile_stabilize",
  B: "tile_expand",
  C: "tile_route",
});

describe("HomeHud", () => {
  it("fires select, spend, cast, and USDC callbacks", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onSpend = vi.fn();
    const onCast = vi.fn();
    const onUsdcChip = vi.fn();

    render(
      <HomeHud
        model={selectedModel}
        selected="B"
        onSelect={onSelect}
        onSpend={onSpend}
        onCast={onCast}
        onUsdcChip={onUsdcChip}
      />,
    );

    await user.click(screen.getByTestId("choice-B"));
    expect(onSelect).toHaveBeenCalledWith("B");

    await user.click(screen.getByTestId("spend-decrease"));
    expect(onSpend).toHaveBeenCalledWith(9);

    await user.click(screen.getByTestId("cast-influence"));
    expect(onCast).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId("hud-usdc"));
    expect(onUsdcChip).toHaveBeenCalledTimes(1);
  });

  it("keeps Cast Influence disabled until a tile is selected", () => {
    render(
      <HomeHud
        model={openModel}
        selected={null}
        onSelect={() => undefined}
        onSpend={() => undefined}
        onCast={() => undefined}
        onUsdcChip={() => undefined}
      />,
    );
    expect(screen.getByTestId("cast-influence")).toHaveProperty("disabled", true);
    expect(screen.getByTestId("day-goal").textContent).toMatch(/MOST/);
    expect(screen.getByText("Stabilize")).toBeTruthy();
    expect(screen.getByText("Listen first")).toBeTruthy();
  });

  it("exposes rank progress to assistive tech", () => {
    render(
      <HomeHud
        model={selectedModel}
        selected="A"
        onSelect={() => undefined}
        onSpend={() => undefined}
        onCast={() => undefined}
        onUsdcChip={() => undefined}
      />,
    );
    const bar = screen.getByRole("progressbar", { name: /influence rank/i });
    expect(bar.getAttribute("aria-valuenow")).toBe("1250");
    expect(bar.getAttribute("aria-valuemax")).toBe("2000");
    expect(screen.getByLabelText("Cast Influence")).toBeTruthy();
    expect(screen.getByTestId("cast-status").textContent).toMatch(/skip Extra/i);
  });
});
