import { buySplitPercents, DAY_SPLIT_BPS, BPS_DENOMINATOR } from "./money";

/**
 * SPARK is an in-game points table, not money and not a token.
 * Stubbed as constants for S1 (non-tradable; no TGE promise).
 */
export const SPARK_TABLE = {
  dailyVoteLock: 5,
  correctPrediction: 15,
  sevenDayStreakWeekly: 25,
} as const;

export const SPARK_STATUS = {
  tradable: false,
  claimableToken: false,
  tgePromise: false,
} as const;

export type SparkAward = {
  spark: number;
  tradable: false;
  claimableToken: false;
  tgePromise: false;
};

export function sparkForDay(input: {
  lockedVote: boolean;
  correct: boolean;
  sevenDayStreak: boolean;
}): SparkAward {
  let spark = 0;
  if (input.lockedVote) {
    spark += SPARK_TABLE.dailyVoteLock;
  }
  if (input.correct) {
    spark += SPARK_TABLE.correctPrediction;
  }
  if (input.sevenDayStreak) {
    spark += SPARK_TABLE.sevenDayStreakWeekly;
  }
  return {
    spark,
    tradable: false,
    claimableToken: false,
    tgePromise: false,
  };
}

export const PLATFORM_FEE_LABEL = "platform service fee";
export const PLATFORM_FEE_LABEL_TR = "hizmet bedeli";
export const STUDIO_NET_LABEL = "studio net";
export const NOVA_BUDGET_LABEL = "Nova operating budget";

const buyPercents = buySplitPercents();
const dayPaidPct = DAY_SPLIT_BPS.paidWinners / (BPS_DENOMINATOR / 100);
const dayFreePct = DAY_SPLIT_BPS.freeWinners / (BPS_DENOMINATOR / 100);

export const PLAYER_POOL_DISCLOSURE =
  `Extra Influence is voluntary; there is no reward guarantee. Of the amount you pay, ${buyPercents.prizePool}% goes to that day's prize pool, ${buyPercents.studioNet}% is ${STUDIO_NET_LABEL}, and ${buyPercents.novaBudget}% is the ${NOVA_BUDGET_LABEL}. Of the pool, ${dayPaidPct}% is shared by correct paid players and ${dayFreePct}% by correct free players, weighted by Influence. This is not a yield or investment promise.`;

export const FORBIDDEN_FINANCE_TERMS = [
  "APR",
  "odds",
  "RTP",
  "house edge",
  "guaranteed yield",
  "TGE",
] as const;

export function containsForbiddenFinanceTerm(text: string): string | undefined {
  return FORBIDDEN_FINANCE_TERMS.find((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(^|[^A-Za-z])${escaped}([^A-Za-z]|$)`, "i");
    return pattern.test(text);
  });
}
