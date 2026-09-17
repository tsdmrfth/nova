import { describe, expect, it } from "vitest";
import {
  EFFECTIVE_EXTRA_CAP,
  EFFECTIVE_FREE_CAP,
  FREE_DAILY_GRANT,
  STREAK_FREE_BONUS_ENABLED,
  burnUnusedFree,
  effectiveExtra,
  effectiveFree,
  grantDailyFree,
  spendInfluence,
} from "./influence";

describe("daily free grant", () => {
  it("grants 10 Free Influence per wallet per day", () => {
    expect(FREE_DAILY_GRANT).toBe(10);
    expect(grantDailyFree()).toBe(10);
  });

  it("does not apply the S1.1 streak free bonus", () => {
    expect(STREAK_FREE_BONUS_ENABLED).toBe(false);
  });
});

describe("spendInfluence", () => {
  it("allows a partial spend and keeps the remainder", () => {
    expect(spendInfluence(10, 7)).toEqual({ spent: 7, remaining: 3 });
    expect(spendInfluence(10, 0)).toEqual({ spent: 0, remaining: 10 });
    expect(spendInfluence(10, 10)).toEqual({ spent: 10, remaining: 0 });
  });

  it("rejects overspend and non-integers", () => {
    expect(() => spendInfluence(10, 11)).toThrow(/exceeds/);
    expect(() => spendInfluence(10, -1)).toThrow(/non-negative integer/);
    expect(() => spendInfluence(10, 1.5)).toThrow(/non-negative integer/);
  });
});

describe("end-of-day free burn", () => {
  it("burns unused Free with no next-day carry", () => {
    expect(burnUnusedFree(3)).toEqual({ burned: 3, carried: 0 });
    expect(burnUnusedFree(0)).toEqual({ burned: 0, carried: 0 });
    expect(burnUnusedFree(10)).toEqual({ burned: 10, carried: 0 });
  });
});

describe("whale soft-cap", () => {
  it("effectiveExtra = min(raw, 100)", () => {
    expect(EFFECTIVE_EXTRA_CAP).toBe(100);
    expect(effectiveExtra(0)).toBe(0);
    expect(effectiveExtra(40)).toBe(40);
    expect(effectiveExtra(100)).toBe(100);
    expect(effectiveExtra(101)).toBe(100);
    expect(effectiveExtra(10_000)).toBe(100);
  });

  it("effectiveFree = min(rawFree, 10)", () => {
    expect(EFFECTIVE_FREE_CAP).toBe(10);
    expect(effectiveFree(7)).toBe(7);
    expect(effectiveFree(10)).toBe(10);
    expect(effectiveFree(12)).toBe(10);
  });
});
