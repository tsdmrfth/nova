import { assertNonNegativeInt } from "./assert";

/** S1 day-goal rotation. W* is scored from Free tallies only. */
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

export type FreeTallyCast = {
  optionId: string;
  free: number;
};

/**
 * Pick W* from Free Influence only. Extra must never change the winning option.
 *
 * Rank is weight descending, then optionId ascending. MOST is rank 0, LEAST is
 * last, MIDDLE is the median rank (index floor(n/2) on that ordered list).
 */
export function pickWinningOption(input: {
  goal: DayGoal;
  optionIds: readonly string[];
  casts: readonly FreeTallyCast[];
}): string {
  if (input.optionIds.length === 0) {
    throw new RangeError("optionIds must be non-empty");
  }
  const seen = new Set<string>();
  for (const id of input.optionIds) {
    if (id.length === 0) {
      throw new RangeError("optionId must be non-empty");
    }
    if (seen.has(id)) {
      throw new RangeError(`duplicate optionId: ${id}`);
    }
    seen.add(id);
  }

  const weights = new Map<string, number>();
  for (const id of input.optionIds) {
    weights.set(id, 0);
  }
  for (const cast of input.casts) {
    if (cast.optionId.length === 0) {
      throw new RangeError("optionId must be non-empty");
    }
    assertNonNegativeInt(cast.free, `free for ${cast.optionId}`);
    if (!weights.has(cast.optionId)) {
      continue;
    }
    weights.set(cast.optionId, (weights.get(cast.optionId) ?? 0) + cast.free);
  }

  const ranked = [...input.optionIds].sort((a, b) => {
    const delta = (weights.get(b) ?? 0) - (weights.get(a) ?? 0);
    if (delta !== 0) {
      return delta;
    }
    return a < b ? -1 : a > b ? 1 : 0;
  });

  if (input.goal === "MOST") {
    return ranked[0] ?? input.optionIds[0] ?? "";
  }
  if (input.goal === "LEAST") {
    return ranked[ranked.length - 1] ?? input.optionIds[0] ?? "";
  }
  return ranked[Math.floor(ranked.length / 2)] ?? input.optionIds[0] ?? "";
}
