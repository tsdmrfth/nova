import { describe, expect, it } from "vitest";
import { containsForbiddenFinanceTerm, dayGoalFor } from "@nova/shared";
import { DEFAULT_SEASON_DAY, getSeasonDay, S1_DAY_1 } from "./season1";

describe("S1 Day 1 copy", () => {
  it("wires HIKAYE First light onto Stabilize / Expand / Route", () => {
    expect(DEFAULT_SEASON_DAY).toBe(1);
    expect(S1_DAY_1.roundTitle).toBe("First light");
    expect(S1_DAY_1.goal).toBe("MOST");
    expect(S1_DAY_1.goal).toBe(dayGoalFor(1));
    expect(S1_DAY_1.scene).toMatch(/three paths glow/i);
    expect(S1_DAY_1.choices.map((choice) => choice.world)).toEqual([
      "Stabilize",
      "Expand",
      "Route",
    ]);
    expect(S1_DAY_1.choices.map((choice) => choice.title)).toEqual([
      "Listen first",
      "Say hello",
      "Find your place",
    ]);
  });

  it("keeps COPY-S1 Free grant hints and no finance claims", () => {
    expect(S1_DAY_1.freeHint).toMatch(/unused free burns/i);
    expect(S1_DAY_1.dayHint).toMatch(/skip extra/i);
    const blob = JSON.stringify(getSeasonDay(1));
    expect(containsForbiddenFinanceTerm(blob)).toBeUndefined();
    expect(blob.toLowerCase()).not.toMatch(/partnered with circle/);
    expect(blob.toLowerCase()).not.toMatch(/official architects/);
    expect(blob.toLowerCase()).not.toMatch(/\bapr\b|\bodds\b|\brtp\b/);
  });
});
