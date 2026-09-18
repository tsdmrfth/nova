import { describe, expect, it } from "vitest";
import {
  EFFECTIVE_EXTRA_CAP,
  FORBIDDEN_FINANCE_TERMS,
  FREE_DAILY_GRANT,
  PACK_CATALOG,
  PLAYER_POOL_DISCLOSURE,
  SPARK_STATUS,
  SPARK_TABLE,
  attemptBuy,
  buildDayPrizePool,
  burnUnusedFree,
  containsForbiddenFinanceTerm,
  effectiveExtra,
  formatUsdc,
  grantDailyFree,
  payoutsByWallet,
  pickWinningOption,
  quotePack,
  settleDay,
  spendInfluence,
  type Cast,
} from "./index";

/**
 * PARA-ACCEPTANCE §A domain fixtures. Each test id maps to a story assertion.
 * Formulas: POOL-DISTRIBUTION (CEO lock v1).
 */
describe("PARA domain fixtures", () => {
  it("F-GRANT: daily free grant = 10; unused burns end-of-day (no roll)", () => {
    expect(FREE_DAILY_GRANT).toBe(10);
    expect(grantDailyFree()).toBe(10);
    expect(burnUnusedFree(10)).toEqual({ burned: 10, carried: 0 });
    expect(burnUnusedFree(3)).toEqual({ burned: 3, carried: 0 });
  });

  it("F-SPEND: partial spend OK (cast 7 of 10 Free); remainder stays until burn", () => {
    const spent = spendInfluence(grantDailyFree(), 7);
    expect(spent).toEqual({ spent: 7, remaining: 3 });
    expect(burnUnusedFree(spent.remaining)).toEqual({ burned: 3, carried: 0 });
  });

  it("P-SPARK: pay 1 USDC → 10 Extra; pool 0.90 / fee 0.10", () => {
    const spark = quotePack("spark");
    expect(spark.extraInfluence).toBe(10);
    expect(formatUsdc(spark.youPay)).toBe("1");
    expect(formatUsdc(spark.prizePool)).toBe("0.9");
    expect(formatUsdc(spark.studioFee)).toBe("0.1");
  });

  it("P-PULSE: pay 5 → 55 Extra; pool 4.50 / fee 0.50", () => {
    const pulse = quotePack("pulse");
    expect(pulse.extraInfluence).toBe(55);
    expect(formatUsdc(pulse.youPay)).toBe("5");
    expect(formatUsdc(pulse.prizePool)).toBe("4.5");
    expect(formatUsdc(pulse.studioFee)).toBe("0.5");
  });

  it("SPLIT-BUY: gross → 90% prize pool / 10% studio fee (purchase-time)", () => {
    const spark = quotePack("spark");
    const pulse = quotePack("pulse");
    expect((spark.prizePool * 10n) / spark.gross).toBe(9n);
    expect((spark.studioFee * 10n) / spark.gross).toBe(1n);
    expect((pulse.prizePool * 10n) / pulse.gross).toBe(9n);
    expect((pulse.studioFee * 10n) / pulse.gross).toBe(1n);
  });

  it("CAP-W: effectiveExtra = min(raw, 100) per wallet/day", () => {
    expect(EFFECTIVE_EXTRA_CAP).toBe(100);
    expect(effectiveExtra(40)).toBe(40);
    expect(effectiveExtra(100)).toBe(100);
    expect(effectiveExtra(250)).toBe(100);
  });

  it("CAP-BUY: max 10 USDC Extra purchases / wallet / day", () => {
    let spent = 0n;
    for (let i = 0; i < 2; i += 1) {
      const pulse = attemptBuy("pulse", spent);
      expect(pulse.ok).toBe(true);
      if (pulse.ok) {
        spent = pulse.spentAfter;
      }
    }
    expect(formatUsdc(spent)).toBe("10");
    const blocked = attemptBuy("spark", spent);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.code).toBe("DAILY_BUY_CAP_EXCEEDED");
    }
  });

  it("DAY-P: example P=54 → paid bucket 48.6 (90%) / free bucket 5.4 (10%)", () => {
    const day = buildDayPrizePool({
      packs: [
        ...Array.from({ length: 20 }, () => "spark" as const),
        ...Array.from({ length: 8 }, () => "pulse" as const),
      ],
    });
    expect(formatUsdc(day.prizePool)).toBe("54");
    expect(formatUsdc(day.paidWinnerBucket)).toBe("48.6");
    expect(formatUsdc(day.freeWinnerBucket)).toBe("5.4");
  });

  it("PRORATA: paid winners split by Extra on W*; free by Free on W*; dual-lane gets both", () => {
    const day = buildDayPrizePool({
      packs: [
        ...Array.from({ length: 20 }, () => "spark" as const),
        ...Array.from({ length: 8 }, () => "pulse" as const),
      ],
    });
    const freeWinners: Cast[] = Array.from({ length: 50 }, (_, i) => ({
      walletId: `f${i}`,
      optionId: "expand",
      extra: 0,
      free: 10,
    }));
    const result = settleDay({
      prizePool: day.prizePool,
      winningOptionId: "expand",
      casts: [
        { walletId: "a", optionId: "expand", extra: 40, free: 0 },
        { walletId: "b", optionId: "expand", extra: 30, free: 0 },
        { walletId: "c", optionId: "expand", extra: 30, free: 0 },
        { walletId: "deniz", optionId: "expand", extra: 40, free: 10 },
        ...freeWinners,
      ],
    });

    const paidAlone = settleDay({
      prizePool: day.prizePool,
      winningOptionId: "expand",
      casts: [
        { walletId: "a", optionId: "expand", extra: 40, free: 0 },
        { walletId: "b", optionId: "expand", extra: 30, free: 0 },
        { walletId: "c", optionId: "expand", extra: 30, free: 0 },
        ...freeWinners,
      ],
    });
    expect(
      Object.fromEntries(paidAlone.paid.shares.map((s) => [s.walletId, formatUsdc(s.payout)])),
    ).toEqual({ a: "19.44", b: "14.58", c: "14.58" });

    const deniz = payoutsByWallet(result).find((row) => row.walletId === "deniz");
    expect(deniz).toBeDefined();
    expect(deniz?.paid).toBeGreaterThan(0n);
    expect(deniz?.free).toBeGreaterThan(0n);
  });

  it("LOSE-POOL: wrong-guess USDC stays in pool for winners — not studio", () => {
    const result = settleDay({
      prizePool: dayPool54(),
      winningOptionId: "expand",
      casts: [
        { walletId: "right", optionId: "expand", extra: 10, free: 0 },
        { walletId: "wrong", optionId: "route", extra: 90, free: 0 },
      ],
    });
    expect(formatUsdc(result.paid.distributed)).toBe("48.6");
    expect(result.paid.shares.map((s) => s.walletId)).toEqual(["right"]);
    expect(result.paid.distributed + result.free.distributed + result.nextDayRollover).toBe(
      dayPool54(),
    );
  });

  it("ROLL: empty winner lane → roll-over to next day P", () => {
    const settled = settleDay({
      prizePool: dayPool54(),
      winningOptionId: "expand",
      casts: [{ walletId: "free-hit", optionId: "expand", extra: 0, free: 10 }],
    });
    expect(formatUsdc(settled.paid.rollover)).toBe("48.6");
    const next = buildDayPrizePool({
      packs: ["spark"],
      rolloverMicroUsdc: settled.nextDayRollover,
    });
    expect(next.prizePool).toBe(settled.nextDayRollover + quotePack("spark").prizePool);
  });

  it("SPARK-NT: SPARK / XP non-tradable; no TGE promise strings in types/copy helpers", () => {
    expect(SPARK_TABLE.dailyVoteLock).toBe(5);
    expect(SPARK_TABLE.correctPrediction).toBe(15);
    expect(SPARK_TABLE.sevenDayStreakWeekly).toBe(25);
    expect(SPARK_STATUS.tradable).toBe(false);
    expect(SPARK_STATUS.claimableToken).toBe(false);
    expect(SPARK_STATUS.tgePromise).toBe(false);
    expect(containsForbiddenFinanceTerm(PLAYER_POOL_DISCLOSURE)).toBeUndefined();
    expect(containsForbiddenFinanceTerm(JSON.stringify(SPARK_STATUS))).toBeUndefined();
    for (const term of FORBIDDEN_FINANCE_TERMS) {
      expect(PLAYER_POOL_DISCLOSURE.toLowerCase()).not.toContain(term.toLowerCase());
    }
  });
});

describe("PARA anti-fixtures", () => {
  it("Extra does not change which option is W*", () => {
    const whaleOnLoser: Cast[] = [
      { walletId: "whale", optionId: "stabilize", extra: 10_000, free: 0 },
      { walletId: "hit", optionId: "expand", extra: 1, free: 0 },
    ];
    const result = settleDay({
      prizePool: dayPool54(),
      winningOptionId: "expand",
      casts: whaleOnLoser,
    });
    expect(result.winningOptionId).toBe("expand");
    expect(result.paid.shares.map((s) => s.walletId)).toEqual(["hit"]);

    expect(
      pickWinningOption({
        goal: "MOST",
        optionIds: ["stabilize", "expand", "route"],
        casts: [
          { optionId: "stabilize", free: 10 },
          { optionId: "expand", free: 40 },
          { optionId: "route", free: 20 },
          { optionId: "stabilize", free: 0 },
        ],
      }),
    ).toBe("expand");
  });

  it("there is no settlement-time studio cut of P", () => {
    const result = settleDay({
      prizePool: dayPool54(),
      winningOptionId: "expand",
      casts: [{ walletId: "hit", optionId: "expand", extra: 10, free: 10 }],
    });
    expect(result.paid.distributed + result.free.distributed + result.nextDayRollover).toBe(
      dayPool54(),
    );
    expect("studioFee" in result).toBe(false);
  });

  it("there is no Pack C / third pack", () => {
    expect(PACK_CATALOG).toHaveLength(2);
    expect(PACK_CATALOG.map((p) => p.id).sort()).toEqual(["pulse", "spark"]);
  });

  it("Free Influence adds no USDC to P", () => {
    const withPacks = buildDayPrizePool({ packs: ["pulse"] });
    const same = buildDayPrizePool({ packs: ["pulse"] });
    expect(withPacks.prizePool).toBe(same.prizePool);
    expect(withPacks.prizePool).toBe(quotePack("pulse").prizePool);
    const freeOnly = buildDayPrizePool({ packs: [] });
    expect(freeOnly.prizePool).toBe(0n);
  });
});

function dayPool54() {
  return buildDayPrizePool({
    packs: [
      ...Array.from({ length: 20 }, () => "spark" as const),
      ...Array.from({ length: 8 }, () => "pulse" as const),
    ],
  }).prizePool;
}
