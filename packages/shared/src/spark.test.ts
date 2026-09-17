import { describe, expect, it } from "vitest";
import {
  FORBIDDEN_FINANCE_TERMS,
  PLATFORM_FEE_LABEL,
  PLAYER_POOL_DISCLOSURE,
  SPARK_STATUS,
  SPARK_TABLE,
  containsForbiddenFinanceTerm,
  sparkForDay,
} from "./spark";

describe("SPARK table", () => {
  it("awards +5 lock, +15 correct, +25 weekly streak", () => {
    expect(SPARK_TABLE).toEqual({
      dailyVoteLock: 5,
      correctPrediction: 15,
      sevenDayStreakWeekly: 25,
    });
    expect(sparkForDay({ lockedVote: true, correct: false, sevenDayStreak: false }).spark).toBe(5);
    expect(sparkForDay({ lockedVote: true, correct: true, sevenDayStreak: false }).spark).toBe(20);
    expect(sparkForDay({ lockedVote: true, correct: true, sevenDayStreak: true }).spark).toBe(45);
    expect(sparkForDay({ lockedVote: false, correct: false, sevenDayStreak: false }).spark).toBe(0);
  });

  it("is non-tradable with no claimable token and no TGE promise", () => {
    expect(SPARK_STATUS).toEqual({
      tradable: false,
      claimableToken: false,
      tgePromise: false,
    });
    const award = sparkForDay({ lockedVote: true, correct: true, sevenDayStreak: false });
    expect(award.tradable).toBe(false);
    expect(award.claimableToken).toBe(false);
    expect(award.tgePromise).toBe(false);
  });
});

describe("copy helpers", () => {
  it("labels the fee as a platform service fee, not house edge", () => {
    expect(PLATFORM_FEE_LABEL).toBe("platform service fee");
  });

  it("keeps disclosure and SPARK types free of APR / odds / RTP / TGE / guaranteed yield", () => {
    expect(containsForbiddenFinanceTerm(PLAYER_POOL_DISCLOSURE)).toBeUndefined();
    expect(containsForbiddenFinanceTerm(JSON.stringify(SPARK_STATUS))).toBeUndefined();
    expect(containsForbiddenFinanceTerm(JSON.stringify(SPARK_TABLE))).toBeUndefined();
    expect(FORBIDDEN_FINANCE_TERMS).toEqual([
      "APR",
      "odds",
      "RTP",
      "house edge",
      "guaranteed yield",
      "TGE",
    ]);
    expect(containsForbiddenFinanceTerm("Claim your TGE allocation")).toBe("TGE");
    expect(containsForbiddenFinanceTerm("96% RTP")).toBe("RTP");
  });
});
