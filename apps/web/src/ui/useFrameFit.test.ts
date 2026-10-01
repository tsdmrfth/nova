import { describe, expect, it } from "vitest";
import { MIN_FIT, nextFit } from "./useFrameFit";

describe("nextFit", () => {
  it("keeps the fit when every region fits", () => {
    expect(nextFit(1, [{ scrollHeight: 800, clientHeight: 800 }])).toBe(1);
    expect(nextFit(0.9, [{ scrollHeight: 500, clientHeight: 800 }])).toBe(0.9);
  });

  it("shrinks by the worst overflow ratio", () => {
    const regions = [
      { scrollHeight: 880, clientHeight: 800 },
      { scrollHeight: 840, clientHeight: 800 },
    ];
    expect(nextFit(1, regions)).toBeCloseTo(800 / 880);
  });

  it("ignores sub-pixel overflow and hidden regions", () => {
    expect(nextFit(1, [{ scrollHeight: 801, clientHeight: 800 }])).toBe(1);
    expect(nextFit(1, [{ scrollHeight: 300, clientHeight: 0 }])).toBe(1);
  });

  it("never drops below MIN_FIT", () => {
    expect(nextFit(1, [{ scrollHeight: 1600, clientHeight: 800 }])).toBe(MIN_FIT);
  });
});
