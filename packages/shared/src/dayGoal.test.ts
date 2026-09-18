import { describe, expect, it } from "vitest";
import { DAY_GOALS, dayGoalFor } from "./dayGoal";

describe("dayGoalFor", () => {
  it("rotates MOST / LEAST / MIDDLE from Day 1", () => {
    expect(DAY_GOALS).toEqual(["MOST", "LEAST", "MIDDLE"]);
    expect(dayGoalFor(1)).toBe("MOST");
    expect(dayGoalFor(2)).toBe("LEAST");
    expect(dayGoalFor(3)).toBe("MIDDLE");
    expect(dayGoalFor(4)).toBe("MOST");
    expect(dayGoalFor(5)).toBe("LEAST");
    expect(dayGoalFor(6)).toBe("MIDDLE");
    expect(dayGoalFor(10)).toBe("MOST");
  });

  it("rejects non-positive days", () => {
    expect(() => dayGoalFor(0)).toThrow(/>= 1/);
    expect(() => dayGoalFor(-1)).toThrow(/non-negative integer/);
    expect(() => dayGoalFor(1.5)).toThrow(/non-negative integer/);
  });
});
