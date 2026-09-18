import { assertNonNegativeInt } from "./assert";

/** S1 day-goal rotation. Scoring is not implemented in this slice. */
export const DAY_GOALS = ["MOST", "LEAST", "MIDDLE"] as const;

export type DayGoal = (typeof DAY_GOALS)[number];

/**
 * Day1 MOST · Day2 LEAST · Day3 MIDDLE · Day4 MOST · …
 * Day numbers are 1-indexed.
 */
export function dayGoalFor(day: number): DayGoal {
  assertNonNegativeInt(day, "day");
  if (day < 1) {
    throw new RangeError("day must be >= 1");
  }
  const goal = DAY_GOALS[(day - 1) % DAY_GOALS.length];
  if (!goal) {
    throw new RangeError("day goal rotation is empty");
  }
  return goal;
}
