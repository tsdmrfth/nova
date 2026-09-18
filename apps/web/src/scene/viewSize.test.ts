import { describe, expect, it } from "vitest";
import {
  classifyFxSlot,
  isUsableViewSize,
  shouldDrawSkyline,
  skylineAdvance,
  SKYLINE_MAX_STEPS,
} from "./viewSize";

describe("view size guards", () => {
  it("rejects empty or non-finite views", () => {
    expect(isUsableViewSize(0, 1080)).toBe(false);
    expect(isUsableViewSize(1920, 0)).toBe(false);
    expect(isUsableViewSize(Number.NaN, 800)).toBe(false);
    expect(isUsableViewSize(1280, 720)).toBe(true);
  });

  it("skips skyline draw for zero or negative sizes", () => {
    expect(shouldDrawSkyline(0, 720)).toBe(false);
    expect(shouldDrawSkyline(-10, 720)).toBe(false);
    expect(shouldDrawSkyline(1280, 0)).toBe(false);
    expect(shouldDrawSkyline(1280, 720)).toBe(true);
  });

  it("never loops unboundedly, including width=0", () => {
    expect(skylineAdvance(0, 0)).toBeGreaterThan(0);
    expect(skylineAdvance(-40, 0)).toBeGreaterThan(0);

    const run = (width: number) => {
      if (!shouldDrawSkyline(width, 720)) {
        return 0;
      }
      let x = -width * 0.02;
      let steps = 0;
      while (x < width * 1.04 && steps < SKYLINE_MAX_STEPS) {
        const step = skylineAdvance(width, width * 0.018);
        if (step <= 0) {
          break;
        }
        x += step;
        steps += 1;
      }
      return steps;
    };

    expect(run(0)).toBe(0);
    expect(run(-64)).toBe(0);
    expect(run(1280)).toBeGreaterThan(0);
    expect(run(1280)).toBeLessThan(SKYLINE_MAX_STEPS);
  });
});

describe("fx slots", () => {
  it("classifies pack fx ids by name, not array index", () => {
    expect(classifyFxSlot("layer_fog_haze")).toBe("haze");
    expect(classifyFxSlot("layer_light_trails")).toBe("trails");
    expect(classifyFxSlot("layer_mystery")).toBe("other");
  });
});
