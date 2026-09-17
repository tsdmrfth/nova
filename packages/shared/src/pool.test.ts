import { describe, expect, it } from "vitest";
import { buildDayPrizePool } from "./pool";
import { formatUsdc, parseUsdc } from "./money";

describe("buildDayPrizePool", () => {
  it("P = Σ(G × 0.90) with no rollover", () => {
    const day = buildDayPrizePool({
      packs: [
        ...Array.from({ length: 20 }, () => "spark" as const),
        ...Array.from({ length: 8 }, () => "pulse" as const),
      ],
    });
    expect(formatUsdc(day.gross)).toBe("60");
    expect(formatUsdc(day.studioFee)).toBe("6");
    expect(formatUsdc(day.prizePool)).toBe("54");
    expect(formatUsdc(day.paidWinnerBucket)).toBe("48.6");
    expect(formatUsdc(day.freeWinnerBucket)).toBe("5.4");
    expect(day.paidWinnerBucket + day.freeWinnerBucket).toBe(day.prizePool);
    expect(day.studioFee + day.prizePool).toBe(day.gross);
  });

  it("adds previous-day rollover into P before the 90/10 day split", () => {
    const day = buildDayPrizePool({
      packs: ["spark"],
      rolloverMicroUsdc: parseUsdc("9.1"),
    });
    // Spark contributes 0.90; + 9.1 rollover → P = 10
    expect(formatUsdc(day.purchasePool)).toBe("0.9");
    expect(formatUsdc(day.prizePool)).toBe("10");
    expect(formatUsdc(day.paidWinnerBucket)).toBe("9");
    expect(formatUsdc(day.freeWinnerBucket)).toBe("1");
  });

  it("does not add Free Influence USDC (empty Extra day is P = rollover only)", () => {
    const empty = buildDayPrizePool({ packs: [] });
    expect(empty.gross).toBe(0n);
    expect(empty.prizePool).toBe(0n);
    expect(empty.studioFee).toBe(0n);

    const rolled = buildDayPrizePool({
      packs: [],
      rolloverMicroUsdc: parseUsdc("5.4"),
    });
    expect(rolled.gross).toBe(0n);
    expect(formatUsdc(rolled.prizePool)).toBe("5.4");
    expect(formatUsdc(rolled.paidWinnerBucket)).toBe("4.86");
    expect(formatUsdc(rolled.freeWinnerBucket)).toBe("0.54");
  });
});
