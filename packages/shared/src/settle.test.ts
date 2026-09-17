import { describe, expect, it } from "vitest";
import { buildDayPrizePool } from "./pool";
import { allocateProRata, payoutsByWallet, settleDay, type Cast } from "./settle";
import { formatUsdc, parseUsdc } from "./money";

const W = "expand";
const L = "stabilize";

function packsForWorkedExample() {
  return [
    ...Array.from({ length: 20 }, () => "spark" as const),
    ...Array.from({ length: 8 }, () => "pulse" as const),
  ];
}

describe("allocateProRata", () => {
  it("pays a sole winner the full bucket", () => {
    const { shares, distributed, remainder } = allocateProRata(parseUsdc("48.6"), [
      { walletId: "deniz", weight: 40 },
    ]);
    expect(formatUsdc(distributed)).toBe("48.6");
    expect(remainder).toBe(0n);
    expect(formatUsdc(shares[0]?.payout ?? 0n)).toBe("48.6");
  });

  it("rolls the whole bucket when the winner lane is empty", () => {
    const { shares, distributed, remainder } = allocateProRata(parseUsdc("48.6"), []);
    expect(shares).toEqual([]);
    expect(distributed).toBe(0n);
    expect(formatUsdc(remainder)).toBe("48.6");
  });

  it("distributes leftover micros by largest remainder, then walletId", () => {
    const { shares, distributed, remainder } = allocateProRata(10n, [
      { walletId: "c", weight: 1 },
      { walletId: "a", weight: 1 },
      { walletId: "b", weight: 1 },
    ]);
    expect(distributed).toBe(10n);
    expect(remainder).toBe(0n);
    const byId = Object.fromEntries(shares.map((s) => [s.walletId, s.payout]));
    // 10/3 → floors 3,3,3 leftover 1 → first by remainder tie: "a"
    expect(byId).toEqual({ a: 4n, b: 3n, c: 3n });
  });

  it("merges duplicate wallet rows before allocating", () => {
    const { shares } = allocateProRata(100n, [
      { walletId: "a", weight: 1 },
      { walletId: "a", weight: 1 },
    ]);
    expect(shares).toEqual([{ walletId: "a", weight: 2, payout: 100n }]);
  });
});

describe("settleDay", () => {
  it("splits the worked example 40/30/30 paid and 50 equal free", () => {
    const day = buildDayPrizePool({ packs: packsForWorkedExample() });
    const freeWinners: Cast[] = Array.from({ length: 50 }, (_, i) => ({
      walletId: `free-${String(i).padStart(2, "0")}`,
      optionId: W,
      extra: 0,
      free: 10,
    }));
    const result = settleDay({
      prizePool: day.prizePool,
      winningOptionId: W,
      casts: [
        { walletId: "a", optionId: W, extra: 40, free: 0 },
        { walletId: "b", optionId: W, extra: 30, free: 0 },
        { walletId: "c", optionId: W, extra: 30, free: 0 },
        ...freeWinners,
      ],
    });

    expect(formatUsdc(result.paid.bucket)).toBe("48.6");
    expect(formatUsdc(result.free.bucket)).toBe("5.4");
    const paid = Object.fromEntries(
      result.paid.shares.map((s) => [s.walletId, formatUsdc(s.payout)]),
    );
    expect(paid).toEqual({ a: "19.44", b: "14.58", c: "14.58" });
    expect(result.free.shares).toHaveLength(50);
    for (const share of result.free.shares) {
      expect(formatUsdc(share.payout)).toBe("0.108");
    }
    expect(result.nextDayRollover).toBe(0n);
    expect(result.paid.distributed + result.free.distributed).toBe(day.prizePool);
  });

  it("pays a dual-lane wallet from both buckets", () => {
    const result = settleDay({
      prizePool: parseUsdc("10"),
      winningOptionId: W,
      casts: [
        { walletId: "deniz", optionId: W, extra: 10, free: 10 },
        { walletId: "bora", optionId: W, extra: 10, free: 0 },
      ],
    });
    const byWallet = Object.fromEntries(
      payoutsByWallet(result).map((row) => [row.walletId, row]),
    );
    expect(formatUsdc(result.paid.bucket)).toBe("9");
    expect(formatUsdc(result.free.bucket)).toBe("1");
    expect(formatUsdc(byWallet.deniz?.paid ?? 0n)).toBe("4.5");
    expect(formatUsdc(byWallet.deniz?.free ?? 0n)).toBe("1");
    expect(formatUsdc(byWallet.deniz?.total ?? 0n)).toBe("5.5");
    expect(formatUsdc(byWallet.bora?.paid ?? 0n)).toBe("4.5");
    expect(formatUsdc(byWallet.bora?.free ?? 0n)).toBe("0");
  });

  it("keeps losers' Extra USDC in the winner buckets (no settlement studio cut)", () => {
    const result = settleDay({
      prizePool: parseUsdc("10"),
      winningOptionId: W,
      casts: [
        { walletId: "winner", optionId: W, extra: 10, free: 0 },
        { walletId: "loser", optionId: L, extra: 90, free: 0 },
      ],
    });
    expect(result.paid.shares).toEqual([
      { walletId: "winner", weight: 10, payout: parseUsdc("9") },
    ]);
    expect(result.paid.shares.some((s) => s.walletId === "loser")).toBe(false);
    expect(result.nextDayRollover).toBe(result.free.bucket);
    expect(result.paid.distributed + result.free.distributed + result.nextDayRollover).toBe(
      parseUsdc("10"),
    );
  });

  it("does not use Extra to pick W* — winningOptionId is an input", () => {
    const casts: Cast[] = [
      { walletId: "whale", optionId: L, extra: 100, free: 0 },
      { walletId: "correct", optionId: W, extra: 1, free: 0 },
    ];
    const result = settleDay({
      prizePool: parseUsdc("10"),
      winningOptionId: W,
      casts,
    });
    expect(result.winningOptionId).toBe(W);
    expect(result.paid.shares.map((s) => s.walletId)).toEqual(["correct"]);
  });

  it("caps paid weight at 100 even when more Extra sits on W*", () => {
    const result = settleDay({
      prizePool: parseUsdc("10"),
      winningOptionId: W,
      casts: [
        { walletId: "whale", optionId: W, extra: 150, free: 0 },
        { walletId: "minnow", optionId: W, extra: 50, free: 0 },
      ],
    });
    expect(result.paid.totalWeight).toBe(150);
    const byId = Object.fromEntries(
      result.paid.shares.map((s) => [s.walletId, s]),
    );
    expect(byId.whale?.weight).toBe(100);
    expect(byId.minnow?.weight).toBe(50);
    expect(formatUsdc(byId.whale?.payout ?? 0n)).toBe("6");
    expect(formatUsdc(byId.minnow?.payout ?? 0n)).toBe("3");
  });

  it("counts only Extra placed on W*, not Extra on losing options", () => {
    const result = settleDay({
      prizePool: parseUsdc("10"),
      winningOptionId: W,
      casts: [
        { walletId: "split", optionId: W, extra: 20, free: 0 },
        { walletId: "split", optionId: L, extra: 80, free: 0 },
      ],
    });
    expect(result.paid.shares).toEqual([
      { walletId: "split", weight: 20, payout: parseUsdc("9") },
    ]);
  });

  it("rolls an empty paid lane, empty free lane, or both, into next-day P", () => {
    const paidEmpty = settleDay({
      prizePool: parseUsdc("10"),
      winningOptionId: W,
      casts: [{ walletId: "free-only", optionId: W, extra: 0, free: 10 }],
    });
    expect(formatUsdc(paidEmpty.paid.rollover)).toBe("9");
    expect(paidEmpty.free.rollover).toBe(0n);
    expect(formatUsdc(paidEmpty.nextDayRollover)).toBe("9");
    expect(formatUsdc(paidEmpty.free.distributed)).toBe("1");

    const freeEmpty = settleDay({
      prizePool: parseUsdc("10"),
      winningOptionId: W,
      casts: [{ walletId: "paid-only", optionId: W, extra: 10, free: 0 }],
    });
    expect(freeEmpty.paid.rollover).toBe(0n);
    expect(formatUsdc(freeEmpty.free.rollover)).toBe("1");
    expect(formatUsdc(freeEmpty.nextDayRollover)).toBe("1");

    const bothEmpty = settleDay({
      prizePool: parseUsdc("10"),
      winningOptionId: W,
      casts: [{ walletId: "wrong", optionId: L, extra: 55, free: 10 }],
    });
    expect(formatUsdc(bothEmpty.nextDayRollover)).toBe("10");
    expect(bothEmpty.paid.distributed + bothEmpty.free.distributed).toBe(0n);
  });

  it("feeds empty-lane rollover into the next day's P", () => {
    const today = settleDay({
      prizePool: parseUsdc("10"),
      winningOptionId: W,
      casts: [],
    });
    const tomorrow = buildDayPrizePool({
      packs: ["spark"],
      rolloverMicroUsdc: today.nextDayRollover,
    });
    expect(formatUsdc(today.nextDayRollover)).toBe("10");
    expect(formatUsdc(tomorrow.prizePool)).toBe("10.9");
  });
});
