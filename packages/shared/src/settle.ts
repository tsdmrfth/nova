import { assertNonNegativeInt, assertNonNegativeMicro } from "./assert";
import { effectiveExtra, effectiveFree } from "./influence";
import type { MicroUsdc } from "./money";
import { DAY_SPLIT_BPS, splitAmountByBps } from "./money";

export type Cast = {
  walletId: string;
  optionId: string;
  extra: number;
  free: number;
};

export type ProRataShare = {
  walletId: string;
  weight: number;
  payout: MicroUsdc;
};

export type LaneSettlement = {
  bucket: MicroUsdc;
  totalWeight: number;
  distributed: MicroUsdc;
  rollover: MicroUsdc;
  shares: ProRataShare[];
};

export type SettlementResult = {
  prizePool: MicroUsdc;
  winningOptionId: string;
  paid: LaneSettlement;
  free: LaneSettlement;
  /** Empty winner lanes roll into the next day's prize pool P. */
  nextDayRollover: MicroUsdc;
};

export type WalletPayout = {
  walletId: string;
  paid: MicroUsdc;
  free: MicroUsdc;
  total: MicroUsdc;
};

/**
 * Largest-remainder (Hamilton) allocation so payouts sum to `bucket`
 * whenever totalWeight > 0. Ties break by walletId ascending.
 */
export function allocateProRata(
  bucket: MicroUsdc,
  entries: ReadonlyArray<{ walletId: string; weight: number }>,
): { shares: ProRataShare[]; distributed: MicroUsdc; remainder: MicroUsdc } {
  assertNonNegativeMicro(bucket, "bucket");

  const merged = new Map<string, number>();
  for (const entry of entries) {
    if (entry.walletId.length === 0) {
      throw new RangeError("walletId must be non-empty");
    }
    assertNonNegativeInt(entry.weight, `weight for ${entry.walletId}`);
    merged.set(entry.walletId, (merged.get(entry.walletId) ?? 0) + entry.weight);
  }

  const positive = [...merged.entries()]
    .filter(([, weight]) => weight > 0)
    .map(([walletId, weight]) => ({ walletId, weight }))
    .sort((a, b) => (a.walletId < b.walletId ? -1 : a.walletId > b.walletId ? 1 : 0));

  const totalWeight = positive.reduce((sum, row) => sum + row.weight, 0);
  if (totalWeight === 0 || bucket === 0n) {
    return {
      shares: positive.map((row) => ({ ...row, payout: 0n })),
      distributed: 0n,
      remainder: bucket,
    };
  }

  const totalWeightBig = BigInt(totalWeight);
  const rows = positive.map((row) => {
    const weight = BigInt(row.weight);
    return {
      walletId: row.walletId,
      weight: row.weight,
      payout: (bucket * weight) / totalWeightBig,
      remainder: (bucket * weight) % totalWeightBig,
    };
  });

  let leftover = bucket - rows.reduce((sum, row) => sum + row.payout, 0n);
  const ranked = [...rows].sort((a, b) => {
    if (a.remainder === b.remainder) {
      return a.walletId < b.walletId ? -1 : a.walletId > b.walletId ? 1 : 0;
    }
    return a.remainder > b.remainder ? -1 : 1;
  });
  for (const row of ranked) {
    if (leftover === 0n) {
      break;
    }
    row.payout += 1n;
    leftover -= 1n;
  }

  const byWallet = new Map(rows.map((row) => [row.walletId, row]));
  const shares = positive.map((row) => {
    const allocated = byWallet.get(row.walletId);
    if (!allocated) {
      throw new Error(`missing allocation for ${row.walletId}`);
    }
    return {
      walletId: row.walletId,
      weight: row.weight,
      payout: allocated.payout,
    };
  });
  const distributed = shares.reduce((sum, share) => sum + share.payout, 0n);
  return { shares, distributed, remainder: bucket - distributed };
}

function rawOnWinner(
  casts: readonly Cast[],
  winningOptionId: string,
  lane: "extra" | "free",
): Map<string, number> {
  const raw = new Map<string, number>();
  for (const cast of casts) {
    if (cast.walletId.length === 0) {
      throw new RangeError("walletId must be non-empty");
    }
    if (cast.optionId.length === 0) {
      throw new RangeError("optionId must be non-empty");
    }
    assertNonNegativeInt(cast.extra, `extra for ${cast.walletId}`);
    assertNonNegativeInt(cast.free, `free for ${cast.walletId}`);
    if (cast.optionId !== winningOptionId) {
      continue;
    }
    const add = lane === "extra" ? cast.extra : cast.free;
    raw.set(cast.walletId, (raw.get(cast.walletId) ?? 0) + add);
  }
  return raw;
}

function settleLane(
  bucket: MicroUsdc,
  weights: ReadonlyArray<{ walletId: string; weight: number }>,
): LaneSettlement {
  const allocation = allocateProRata(bucket, weights);
  const totalWeight = weights.reduce((sum, row) => sum + row.weight, 0);
  const empty = totalWeight === 0;
  return {
    bucket,
    totalWeight,
    distributed: empty ? 0n : allocation.distributed,
    rollover: empty ? bucket : allocation.remainder,
    shares: allocation.shares,
  };
}

/**
 * Settle a day. W* is an input — Extra weight never picks the winning option.
 *
 * pay_i (paid) = PaidBucket × effectiveExtra_i(W*) / Σ effectiveExtra_j(W*)
 * pay_i (free) = FreeBucket × effectiveFree_i(W*) / Σ effectiveFree_j(W*)
 *
 * Empty paid and/or free winner lanes roll the unused bucket into next-day P.
 * Losers' Extra USDC stays in the winner buckets (studio is not paid again).
 */
export function settleDay(input: {
  prizePool: MicroUsdc;
  winningOptionId: string;
  casts: readonly Cast[];
}): SettlementResult {
  assertNonNegativeMicro(input.prizePool, "prizePool");
  if (input.winningOptionId.length === 0) {
    throw new RangeError("winningOptionId must be non-empty");
  }

  const { paidWinnerBucket, freeWinnerBucket } = splitAmountByBps(
    input.prizePool,
    DAY_SPLIT_BPS,
  );

  const extraRaw = rawOnWinner(input.casts, input.winningOptionId, "extra");
  const freeRaw = rawOnWinner(input.casts, input.winningOptionId, "free");

  const paidWeights = [...extraRaw.entries()].map(([walletId, raw]) => ({
    walletId,
    weight: effectiveExtra(raw),
  }));
  const freeWeights = [...freeRaw.entries()].map(([walletId, raw]) => ({
    walletId,
    weight: effectiveFree(raw),
  }));

  const paid = settleLane(paidWinnerBucket, paidWeights);
  const free = settleLane(freeWinnerBucket, freeWeights);

  return {
    prizePool: input.prizePool,
    winningOptionId: input.winningOptionId,
    paid,
    free,
    nextDayRollover: paid.rollover + free.rollover,
  };
}

/** Merge paid + free lanes so a dual-lane wallet shows as one row. */
export function payoutsByWallet(result: SettlementResult): WalletPayout[] {
  const merged = new Map<string, WalletPayout>();
  const add = (walletId: string, lane: "paid" | "free", amount: MicroUsdc) => {
    const current = merged.get(walletId) ?? {
      walletId,
      paid: 0n,
      free: 0n,
      total: 0n,
    };
    if (lane === "paid") {
      current.paid += amount;
    } else {
      current.free += amount;
    }
    current.total = current.paid + current.free;
    merged.set(walletId, current);
  };
  for (const share of result.paid.shares) {
    add(share.walletId, "paid", share.payout);
  }
  for (const share of result.free.shares) {
    add(share.walletId, "free", share.payout);
  }
  return [...merged.values()].sort((a, b) =>
    a.walletId < b.walletId ? -1 : a.walletId > b.walletId ? 1 : 0,
  );
}
