export { hello } from "./hello";

export {
  BPS_DENOMINATOR,
  BUY_SPLIT_BPS,
  DAY_SPLIT_BPS,
  MICRO_USDC_PER_USDC,
  USDC_DECIMALS,
  formatUsdc,
  parseUsdc,
  splitAmountByBps,
  splitGrossBuy,
} from "./money";
export type { BuySplit, MicroUsdc } from "./money";

export {
  MAX_DAILY_EXTRA_BUY_MICRO,
  PACK_CATALOG,
  PULSE_PACK,
  SPARK_PACK,
  attemptBuy,
  getPack,
  isPackId,
  quotePack,
  remainingDailyBuyMicro,
  simulateBuys,
  summarizePurchases,
} from "./packs";
export type {
  BuyAccepted,
  BuyAttempt,
  BuyRejected,
  Pack,
  PackId,
  PackQuote,
  PurchaseSummary,
  SimulatedBuys,
} from "./packs";

export {
  EFFECTIVE_EXTRA_CAP,
  EFFECTIVE_FREE_CAP,
  FREE_DAILY_GRANT,
  STREAK_FREE_BONUS,
  STREAK_FREE_BONUS_ENABLED,
  burnUnusedFree,
  effectiveExtra,
  effectiveFree,
  grantDailyFree,
  spendInfluence,
} from "./influence";
export type { SpendResult } from "./influence";

export { DAY_GOALS, dayGoalFor, pickWinningOption } from "./dayGoal";
export type { DayGoal, FreeTallyCast } from "./dayGoal";

export { buildDayPrizePool } from "./pool";
export type { DayPrizePool } from "./pool";

export { allocateProRata, payoutsByWallet, settleDay } from "./settle";
export type {
  Cast,
  LaneSettlement,
  ProRataShare,
  SettlementResult,
  WalletPayout,
} from "./settle";

export {
  FORBIDDEN_FINANCE_TERMS,
  PLATFORM_FEE_LABEL,
  PLATFORM_FEE_LABEL_TR,
  PLAYER_POOL_DISCLOSURE,
  SPARK_STATUS,
  SPARK_TABLE,
  containsForbiddenFinanceTerm,
  sparkForDay,
} from "./spark";
export type { SparkAward } from "./spark";
