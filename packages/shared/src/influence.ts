import { assertNonNegativeInt } from "./assert";

/** Daily free grant / wallet / day. Unused burns at end of day (no roll). */
export const FREE_DAILY_GRANT = 10;

/** S1 hard ceiling: effectiveExtra = min(raw, 100). */
export const EFFECTIVE_EXTRA_CAP = 100;

/** Free lane cap; grant is already 10. */
export const EFFECTIVE_FREE_CAP = 10;

/** S1.1 streak free bonus is locked off for launch. */
export const STREAK_FREE_BONUS_ENABLED = false;

export const STREAK_FREE_BONUS = {
  perThreeDayStreak: 2,
  cap: 6,
} as const;

export function grantDailyFree(): number {
  return FREE_DAILY_GRANT;
}

/**
 * effectiveExtra = min(raw, 100)
 * `raw` is Extra Influence placed on the winning option W* that day.
 */
export function effectiveExtra(rawOnWinningOption: number): number {
  assertNonNegativeInt(rawOnWinningOption, "raw extra");
  return Math.min(rawOnWinningOption, EFFECTIVE_EXTRA_CAP);
}

/**
 * effectiveFree = min(rawFree, 10)
 * `rawFree` is Free Influence placed on the winning option W* that day.
 */
export function effectiveFree(rawOnWinningOption: number): number {
  assertNonNegativeInt(rawOnWinningOption, "raw free");
  return Math.min(rawOnWinningOption, EFFECTIVE_FREE_CAP);
}

export type SpendResult = {
  spent: number;
  remaining: number;
};

/** Partial spend is OK; remainder stays until end-of-day burn. */
export function spendInfluence(balance: number, amount: number): SpendResult {
  assertNonNegativeInt(balance, "balance");
  assertNonNegativeInt(amount, "amount");
  if (amount > balance) {
    throw new RangeError("spend exceeds balance");
  }
  return { spent: amount, remaining: balance - amount };
}

/** Unused Free does not roll to the next day. */
export function burnUnusedFree(remaining: number): { burned: number; carried: 0 } {
  assertNonNegativeInt(remaining, "remaining free");
  return { burned: remaining, carried: 0 };
}
