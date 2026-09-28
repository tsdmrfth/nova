import { assertNonNegativeMicro } from "./assert";

/** 1 USDC = 1_000_000 micro-USDC (USDC's 6 on-chain decimals). */
export type MicroUsdc = bigint;

export const USDC_DECIMALS = 6;
export const MICRO_USDC_PER_USDC = 1_000_000n;
export const BPS_DENOMINATOR = 10_000;

/**
 * Purchase-time gross split (POOL-DISTRIBUTION / Arc grant lock).
 * 90% prize / 8% studio net / 2% Nova operating budget.
 */
export const BUY_SPLIT_BPS = {
  prizePool: 9_000,
  studioNet: 800,
  novaBudget: 200,
} as const;

/** Settlement split of day prize pool P (POOL-DISTRIBUTION §3). */
export const DAY_SPLIT_BPS = {
  paidWinners: 9_000,
  freeWinners: 1_000,
} as const;

const USDC_DECIMAL_RE = /^\d+(\.\d{1,6})?$/;

/**
 * Parse a decimal USDC string ("19.44", "0.108") into micro-USDC.
 * Strings only — never pass IEEE floats into money math.
 */
export function parseUsdc(decimal: string): MicroUsdc {
  if (!USDC_DECIMAL_RE.test(decimal)) {
    throw new RangeError(`Invalid USDC amount: ${decimal}`);
  }
  const [wholeRaw, fracRaw = ""] = decimal.split(".");
  const whole = wholeRaw ?? "0";
  const fracPadded = fracRaw.padEnd(USDC_DECIMALS, "0");
  return BigInt(whole) * MICRO_USDC_PER_USDC + BigInt(fracPadded);
}

/** Format micro-USDC as a decimal string, trimming trailing zeros. */
export function formatUsdc(micro: MicroUsdc): string {
  const negative = micro < 0n;
  const abs = negative ? -micro : micro;
  const whole = abs / MICRO_USDC_PER_USDC;
  const frac = abs % MICRO_USDC_PER_USDC;
  const sign = negative ? "-" : "";
  if (frac === 0n) {
    return `${sign}${whole.toString()}`;
  }
  const fracStr = frac
    .toString()
    .padStart(USDC_DECIMALS, "0")
    .replace(/0+$/, "");
  return `${sign}${whole.toString()}.${fracStr}`;
}

export type BuySplit = {
  gross: MicroUsdc;
  prizePool: MicroUsdc;
  studioNet: MicroUsdc;
  novaBudget: MicroUsdc;
};

export type BuySplitPercents = {
  prizePool: number;
  studioNet: number;
  novaBudget: number;
};

/** Whole-number percents for copy. The USDC split itself stays in `splitGrossBuy`. */
export function buySplitPercents(): BuySplitPercents {
  const unit = BPS_DENOMINATOR / 100;
  return {
    prizePool: BUY_SPLIT_BPS.prizePool / unit,
    studioNet: BUY_SPLIT_BPS.studioNet / unit,
    novaBudget: BUY_SPLIT_BPS.novaBudget / unit,
  };
}

/**
 * Purchase-time split: 90% prize / 8% studio net / 2% Nova operating budget.
 * Dust from integer division stays in the prize pool so studio net never
 * exceeds 8%, the Nova budget never exceeds 2%, and the three parts sum to gross.
 */
export function splitGrossBuy(gross: MicroUsdc): BuySplit {
  assertNonNegativeMicro(gross, "gross");
  const studioNet =
    (gross * BigInt(BUY_SPLIT_BPS.studioNet)) / BigInt(BPS_DENOMINATOR);
  const novaBudget =
    (gross * BigInt(BUY_SPLIT_BPS.novaBudget)) / BigInt(BPS_DENOMINATOR);
  const prizePool = gross - studioNet - novaBudget;
  return { gross, prizePool, studioNet, novaBudget };
}

/**
 * Split an amount by basis points, sending integer dust to `remainderTo`
 * so the parts always sum to `amount`.
 */
export function splitAmountByBps(
  amount: MicroUsdc,
  parts: { paidWinners: number; freeWinners: number },
): { paidWinnerBucket: MicroUsdc; freeWinnerBucket: MicroUsdc } {
  assertNonNegativeMicro(amount, "amount");
  if (parts.paidWinners + parts.freeWinners !== BPS_DENOMINATOR) {
    throw new RangeError("day split basis points must sum to 10_000");
  }
  const paidWinnerBucket =
    (amount * BigInt(parts.paidWinners)) / BigInt(BPS_DENOMINATOR);
  const freeWinnerBucket = amount - paidWinnerBucket;
  return { paidWinnerBucket, freeWinnerBucket };
}
