import { describe, expect, it } from "vitest";
import { containsForbiddenFinanceTerm, dayGoalFor } from "@nova/shared";
import {
  DEFAULT_SEASON_DAY,
  S1_WEEK_1,
  WEEK1_BAR_MAX,
  getSeasonDay,
  isTurningDay,
  nextOpening,
  sceneForDay,
  traitBarsFromWinners,
  S1_DAY_1,
} from "./season1";

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

describe("S1 week 1", () => {
  it("gives each day its own question and the same three worlds", () => {
    expect(S1_WEEK_1.map((copy) => copy.roundTitle)).toEqual([
      "First light",
      "First task",
      "The jar",
      "Wrong word",
      "Neighbor",
      "New tool",
      "Week's close",
    ]);
    expect(S1_WEEK_1.map((copy) => copy.goal)).toEqual([
      "MOST",
      "LEAST",
      "MIDDLE",
      "MOST",
      "LEAST",
      "MIDDLE",
      "MOST",
    ]);
    for (const copy of S1_WEEK_1) {
      expect(copy.goal).toBe(dayGoalFor(copy.day));
      expect(copy.choices.map((choice) => choice.world)).toEqual(["Stabilize", "Expand", "Route"]);
      expect(nextOpening(copy, "A")).toBeTruthy();
      expect(nextOpening(copy, "B")).toBeTruthy();
      expect(nextOpening(copy, "C")).toBeTruthy();
    }
    expect(isTurningDay(7)).toBe(true);
    expect(isTurningDay(1)).toBe(false);
    expect(isTurningDay(14)).toBe(false);
  });

  it("opens the next morning with yesterday's winning line", () => {
    expect(sceneForDay(1, [])).toMatch(/three paths glow/i);
    expect(sceneForDay(2, [{ day: 1, winner: "A" }])).toMatch(/stayed quiet/i);
    expect(sceneForDay(2, [{ day: 1, winner: "A" }])).toMatch(/today's plan/i);
    expect(sceneForDay(2, [])).toBe(getSeasonDay(2).scene);
    expect(getSeasonDay(8).roundTitle).toBe("First light");
    expect(nextOpening(getSeasonDay(8), "B")).toBeNull();
    const blob = JSON.stringify(S1_WEEK_1);
    expect(containsForbiddenFinanceTerm(blob)).toBeUndefined();
  });

  it("scores week 1 traits from settled winners, with day 7 counting double", () => {
    const winners = [1, 2, 3, 4, 5, 6, 7].map((day) => ({ day, winner: "A" as const }));
    expect(traitBarsFromWinners(winners)).toEqual({ Stabilize: WEEK1_BAR_MAX, Expand: 0, Route: 0 });
    expect(WEEK1_BAR_MAX).toBe(8);
    expect(traitBarsFromWinners([{ day: 7, winner: "C" }])).toEqual({
      Stabilize: 0,
      Expand: 0,
      Route: 2,
    });
    expect(traitBarsFromWinners([{ day: 8, winner: "B" }])).toEqual({
      Stabilize: 0,
      Expand: 0,
      Route: 0,
    });
  });
});
