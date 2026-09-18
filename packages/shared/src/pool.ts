import { assertNonNegativeMicro } from "./assert";
import type { MicroUsdc } from "./money";
import { DAY_SPLIT_BPS, splitAmountByBps } from "./money";
import type { PackId, PurchaseSummary } from "./packs";
import { summarizePurchases } from "./packs";

export type DayPrizePool = {
  counts: PurchaseSummary["counts"];
  extraInfluence: number;
  gross: MicroUsdc;
  studioFee: MicroUsdc;
  reserve: MicroUsdc;
  /** Σ(G × 0.90) from today's Extra buys. Free Influence adds 0. */
  purchasePool: MicroUsdc;
  rollover: MicroUsdc;
  /** P = purchasePool + rollover */
  prizePool: MicroUsdc;
  paidWinnerBucket: MicroUsdc;
  freeWinnerBucket: MicroUsdc;
};

/**
 * Build the day's prize pool from Extra pack purchases plus optional rollover.
 *
 * P = Σ (gross × 0.90) + rollover
 * paidWinnerBucket = 90% of P
 * freeWinnerBucket = 10% of P
 */
export function buildDayPrizePool(input: {
  packs?: readonly PackId[];
  rolloverMicroUsdc?: MicroUsdc;
}): DayPrizePool {
  const purchases = summarizePurchases(input.packs ?? []);
  const rollover = input.rolloverMicroUsdc ?? 0n;
  assertNonNegativeMicro(rollover, "rollover");
  const purchasePool = purchases.prizePool;
  const prizePool = purchasePool + rollover;
  const { paidWinnerBucket, freeWinnerBucket } = splitAmountByBps(
    prizePool,
    DAY_SPLIT_BPS,
  );
  return {
    counts: purchases.counts,
    extraInfluence: purchases.extraInfluence,
    gross: purchases.gross,
    studioFee: purchases.studioFee,
    reserve: purchases.reserve,
    purchasePool,
    rollover,
    prizePool,
    paidWinnerBucket,
    freeWinnerBucket,
  };
}
