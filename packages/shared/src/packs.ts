import { assertNonNegativeMicro } from "./assert";
import type { MicroUsdc } from "./money";
import { parseUsdc, splitGrossBuy, type BuySplit } from "./money";

/** S1 packs only — Spark and Pulse. Pack C / Nova is not sold. */
export const SPARK_PACK = {
  id: "spark",
  name: "Spark",
  priceMicroUsdc: parseUsdc("1"),
  extraInfluence: 10,
} as const;

export const PULSE_PACK = {
  id: "pulse",
  name: "Pulse",
  priceMicroUsdc: parseUsdc("5"),
  extraInfluence: 55,
} as const;

export const PACK_CATALOG = [SPARK_PACK, PULSE_PACK] as const;

export type Pack = (typeof PACK_CATALOG)[number];
export type PackId = Pack["id"];

/** Max 10 USDC Extra purchases / wallet / day (Spark×10 or Pulse×2). */
export const MAX_DAILY_EXTRA_BUY_MICRO: MicroUsdc = parseUsdc("10");

export function isPackId(value: string): value is PackId {
  return value === SPARK_PACK.id || value === PULSE_PACK.id;
}

export function getPack(id: string): Pack {
  const pack = PACK_CATALOG.find((item) => item.id === id);
  if (!pack) {
    throw new RangeError(`Unknown pack: ${id}`);
  }
  return pack;
}

export type PackQuote = BuySplit & {
  packId: PackId;
  extraInfluence: number;
  youPay: MicroUsdc;
};

/** Quote a pack: Extra granted and the 90/8/2 USDC split. */
export function quotePack(packId: PackId): PackQuote {
  const pack = getPack(packId);
  const split = splitGrossBuy(pack.priceMicroUsdc);
  return {
    packId,
    extraInfluence: pack.extraInfluence,
    youPay: pack.priceMicroUsdc,
    ...split,
  };
}

export function remainingDailyBuyMicro(spentToday: MicroUsdc): MicroUsdc {
  assertNonNegativeMicro(spentToday, "spentToday");
  if (spentToday >= MAX_DAILY_EXTRA_BUY_MICRO) {
    return 0n;
  }
  return MAX_DAILY_EXTRA_BUY_MICRO - spentToday;
}

export type BuyAccepted = PackQuote & {
  ok: true;
  spentAfter: MicroUsdc;
};

export type BuyRejected = {
  ok: false;
  packId: PackId;
  code: "DAILY_BUY_CAP_EXCEEDED";
  spentToday: MicroUsdc;
  remaining: MicroUsdc;
  youPay: MicroUsdc;
};

export type BuyAttempt = BuyAccepted | BuyRejected;

export function attemptBuy(packId: PackId, spentToday: MicroUsdc): BuyAttempt {
  const quote = quotePack(packId);
  const remaining = remainingDailyBuyMicro(spentToday);
  if (quote.youPay > remaining) {
    return {
      ok: false,
      packId,
      code: "DAILY_BUY_CAP_EXCEEDED",
      spentToday,
      remaining,
      youPay: quote.youPay,
    };
  }
  return {
    ...quote,
    ok: true,
    spentAfter: spentToday + quote.youPay,
  };
}

export type PurchaseSummary = {
  counts: Record<PackId, number>;
  extraInfluence: number;
  gross: MicroUsdc;
  prizePool: MicroUsdc;
  studioNet: MicroUsdc;
  novaBudget: MicroUsdc;
};

export function summarizePurchases(
  packIds: readonly PackId[],
): PurchaseSummary {
  const counts: Record<PackId, number> = { spark: 0, pulse: 0 };
  let extraInfluence = 0;
  let gross = 0n;
  let prizePool = 0n;
  let studioNet = 0n;
  let novaBudget = 0n;
  for (const packId of packIds) {
    const quote = quotePack(packId);
    counts[packId] += 1;
    extraInfluence += quote.extraInfluence;
    gross += quote.gross;
    prizePool += quote.prizePool;
    studioNet += quote.studioNet;
    novaBudget += quote.novaBudget;
  }
  return {
    counts,
    extraInfluence,
    gross,
    prizePool,
    studioNet,
    novaBudget,
  };
}

export type SimulatedBuys = {
  accepted: BuyAccepted[];
  rejected: BuyRejected[];
  spent: MicroUsdc;
  extraInfluence: number;
};

/** Apply packs in order, stopping each over-cap buy without applying it. */
export function simulateBuys(packIds: readonly PackId[]): SimulatedBuys {
  const accepted: BuyAccepted[] = [];
  const rejected: BuyRejected[] = [];
  let spent = 0n;
  let extraInfluence = 0;
  for (const packId of packIds) {
    const attempt = attemptBuy(packId, spent);
    if (attempt.ok) {
      accepted.push(attempt);
      spent = attempt.spentAfter;
      extraInfluence += attempt.extraInfluence;
    } else {
      rejected.push(attempt);
    }
  }
  return { accepted, rejected, spent, extraInfluence };
}
