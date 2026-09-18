import { describe, expect, it } from "vitest";
import {
  MAX_DAILY_EXTRA_BUY_MICRO,
  PACK_CATALOG,
  attemptBuy,
  getPack,
  isPackId,
  quotePack,
  remainingDailyBuyMicro,
  simulateBuys,
  summarizePurchases,
} from "./packs";
import { formatUsdc, parseUsdc } from "./money";

describe("pack catalog", () => {
  it("lists only Spark and Pulse", () => {
    expect(PACK_CATALOG.map((pack) => pack.id)).toEqual(["spark", "pulse"]);
    expect(PACK_CATALOG).toHaveLength(2);
    expect(isPackId("spark")).toBe(true);
    expect(isPackId("pulse")).toBe(true);
    expect(isPackId("nova")).toBe(false);
    expect(isPackId("pack-c")).toBe(false);
  });

  it("rejects Pack C / unknown ids", () => {
    expect(() => getPack("nova")).toThrow(/Unknown pack/);
    expect(() => getPack("c")).toThrow(/Unknown pack/);
  });
});

describe("quotePack", () => {
  it("Spark: 1 USDC → 10 Extra, pool 0.90, fee 0.10", () => {
    const quote = quotePack("spark");
    expect(quote.extraInfluence).toBe(10);
    expect(formatUsdc(quote.youPay)).toBe("1");
    expect(formatUsdc(quote.prizePool)).toBe("0.9");
    expect(formatUsdc(quote.studioFee)).toBe("0.1");
    expect(quote.reserve).toBe(0n);
    expect(quote.prizePool + quote.studioFee).toBe(quote.youPay);
  });

  it("Pulse: 5 USDC → 55 Extra, pool 4.50, fee 0.50", () => {
    const quote = quotePack("pulse");
    expect(quote.extraInfluence).toBe(55);
    expect(formatUsdc(quote.youPay)).toBe("5");
    expect(formatUsdc(quote.prizePool)).toBe("4.5");
    expect(formatUsdc(quote.studioFee)).toBe("0.5");
    expect(quote.prizePool + quote.studioFee).toBe(quote.youPay);
  });
});

describe("daily Extra buy cap", () => {
  it("caps gross Extra buys at 10 USDC / wallet / day", () => {
    expect(MAX_DAILY_EXTRA_BUY_MICRO).toBe(parseUsdc("10"));
    expect(remainingDailyBuyMicro(0n)).toBe(parseUsdc("10"));
    expect(remainingDailyBuyMicro(parseUsdc("10"))).toBe(0n);
    expect(remainingDailyBuyMicro(parseUsdc("11"))).toBe(0n);
  });

  it("allows Spark×10 and rejects the 11th", () => {
    const spark10 = Array.from({ length: 10 }, () => "spark" as const);
    const ok = simulateBuys(spark10);
    expect(ok.rejected).toEqual([]);
    expect(ok.spent).toBe(parseUsdc("10"));
    expect(ok.extraInfluence).toBe(100);

    const eleventh = attemptBuy("spark", ok.spent);
    expect(eleventh.ok).toBe(false);
    if (!eleventh.ok) {
      expect(eleventh.code).toBe("DAILY_BUY_CAP_EXCEEDED");
      expect(eleventh.remaining).toBe(0n);
    }
  });

  it("allows Pulse×2 and rejects the 3rd", () => {
    const ok = simulateBuys(["pulse", "pulse"]);
    expect(ok.spent).toBe(parseUsdc("10"));
    expect(ok.extraInfluence).toBe(110);

    const third = attemptBuy("pulse", ok.spent);
    expect(third.ok).toBe(false);
  });

  it("allows mixed Spark+Pulse up to 10 USDC in order", () => {
    const mix = simulateBuys(["pulse", "spark", "spark", "spark", "spark", "spark"]);
    expect(mix.rejected).toEqual([]);
    expect(mix.spent).toBe(parseUsdc("10"));

    const over = simulateBuys(["spark", "spark", "spark", "spark", "spark", "spark", "pulse"]);
    expect(over.accepted).toHaveLength(6);
    expect(over.spent).toBe(parseUsdc("6"));
    expect(over.rejected).toHaveLength(1);
    expect(over.rejected[0]?.packId).toBe("pulse");
  });
});

describe("summarizePurchases", () => {
  it("matches the 20 Spark + 8 Pulse worked example (gross 60)", () => {
    const packs = [
      ...Array.from({ length: 20 }, () => "spark" as const),
      ...Array.from({ length: 8 }, () => "pulse" as const),
    ];
    const summary = summarizePurchases(packs);
    expect(summary.counts).toEqual({ spark: 20, pulse: 8 });
    expect(formatUsdc(summary.gross)).toBe("60");
    expect(formatUsdc(summary.studioFee)).toBe("6");
    expect(formatUsdc(summary.prizePool)).toBe("54");
    expect(summary.extraInfluence).toBe(20 * 10 + 8 * 55);
  });
});
