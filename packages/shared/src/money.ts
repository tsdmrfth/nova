import { assertNonNegativeMicro } from "./assert";

/** 1 USDC = 1_000_000 micro-USDC (USDC's 6 on-chain decimals). */
export type MicroUsdc = bigint;

export const USDC_DECIMALS = 6;
export const MICRO_USDC_PER_USDC = 1_000_000n;
export const BPS_DENOMINATOR = 10_000;

/** Purchase-time gross split (POOL-DISTRIBUTION §2). */
export const BUY_SPLIT_BPS = {
  prizePool: 9_000,
  studioFee: 1_000,
  reserve: 0,
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
  studioFee: MicroUsdc;
  reserve: MicroUsdc;
};

/**
 * Purchase-time split: 90% prize pool / 10% studio fee / 0% reserve.
 * Dust from integer division (if any) stays in the prize pool so
 * studioFee never exceeds 10% and studioFee + prizePool + reserve === gross.
 */
export function splitGrossBuy(gross: MicroUsdc): BuySplit {
  assertNonNegativeMicro(gross, "gross");
  const studioFee =
    (gross * BigInt(BUY_SPLIT_BPS.studioFee)) / BigInt(BPS_DENOMINATOR);
  const reserve =
    (gross * BigInt(BUY_SPLIT_BPS.reserve)) / BigInt(BPS_DENOMINATOR);
  const prizePool = gross - studioFee - reserve;
  return { gross, prizePool, studioFee, reserve };
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
