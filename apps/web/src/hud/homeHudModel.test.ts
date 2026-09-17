import { describe, expect, it } from "vitest";
import { getAssetUrl } from "@nova/assets";
import { containsForbiddenFinanceTerm } from "@nova/shared";
import { HOME_HUD_MODEL } from "./homeHudModel";

describe("home HUD model", () => {
  it("matches the FINAL-HOME layout copy", () => {
    expect(HOME_HUD_MODEL.day).toBe(7);
    expect(HOME_HUD_MODEL.freeInfluence).toBe(10);
    expect(HOME_HUD_MODEL.extraInfluence).toBe(0);
    expect(HOME_HUD_MODEL.usdcLabel).toBe("USDC");
    expect(HOME_HUD_MODEL.heroTitle).toBe("Design today's economy.");
    expect(HOME_HUD_MODEL.choices.map((choice) => choice.id)).toEqual([
      "A",
      "B",
      "C",
    ]);
    expect(HOME_HUD_MODEL.choices.map((choice) => choice.label)).toEqual([
      "Stabilize",
      "Expand",
      "Route",
    ]);
  });

  it("resolves choice art through canon ids", () => {
    for (const choice of HOME_HUD_MODEL.choices) {
      expect(getAssetUrl(choice.artId)).toBeTruthy();
      expect(choice.artId).not.toMatch(/drafts/);
    }
  });

  it("does not use guaranteed-yield language", () => {
    const blob = JSON.stringify(HOME_HUD_MODEL);
    expect(containsForbiddenFinanceTerm(blob)).toBeUndefined();
    expect(blob.toLowerCase()).not.toMatch(/partnered with circle/);
  });
});
