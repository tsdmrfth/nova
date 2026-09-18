import { describe, expect, it } from "vitest";
import { getAssetUrl } from "@nova/assets";
import { containsForbiddenFinanceTerm } from "@nova/shared";
import { createDayState } from "../day/dayStore";
import { buildHudModel } from "./homeHudModel";

const now = new Date("2026-09-18T12:00:00");

const DAY_1_MODEL = buildHudModel(createDayState(1, now), {
  A: "tile_stabilize",
  B: "tile_expand",
  C: "tile_route",
});

describe("home HUD model", () => {
  it("uses Day 1 First light copy on Stabilize / Expand / Route tiles", () => {
    expect(DAY_1_MODEL.day).toBe(1);
    expect(DAY_1_MODEL.goal).toBe("MOST");
    expect(DAY_1_MODEL.freeInfluence).toBe(10);
    expect(DAY_1_MODEL.extraInfluence).toBe(0);
    expect(DAY_1_MODEL.usdcLabel).toBe("USDC");
    expect(DAY_1_MODEL.heroTitle).toBe("First light");
    expect(DAY_1_MODEL.scene).toMatch(/three paths glow/i);
    expect(DAY_1_MODEL.choices.map((choice) => choice.id)).toEqual([
      "A",
      "B",
      "C",
    ]);
    expect(DAY_1_MODEL.choices.map((choice) => choice.label)).toEqual([
      "Stabilize",
      "Expand",
      "Route",
    ]);
    expect(DAY_1_MODEL.choices.map((choice) => choice.title)).toEqual([
      "Listen first",
      "Say hello",
      "Find your place",
    ]);
  });

  it("resolves choice art through canon ids", () => {
    for (const choice of DAY_1_MODEL.choices) {
      expect(getAssetUrl(choice.artId)).toBeTruthy();
      expect(choice.artId).not.toMatch(/drafts/);
    }
  });

  it("does not use guaranteed-yield language", () => {
    const blob = JSON.stringify(DAY_1_MODEL);
    expect(containsForbiddenFinanceTerm(blob)).toBeUndefined();
    expect(blob.toLowerCase()).not.toMatch(/partnered with circle/);
    expect(blob.toLowerCase()).not.toMatch(/official architects/);
  });
});
