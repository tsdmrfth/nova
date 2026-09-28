import { describe, expect, it } from "vitest";
import {
  BPS_DENOMINATOR,
  BUY_SPLIT_BPS,
  formatUsdc,
  parseUsdc,
  splitAmountByBps,
  splitGrossBuy,
} from "./money";

describe("micro-USDC", () => {
  it("parses and formats the spec example amounts", () => {
    expect(parseUsdc("1")).toBe(1_000_000n);
    expect(parseUsdc("5")).toBe(5_000_000n);
    expect(parseUsdc("0.90")).toBe(900_000n);
    expect(parseUsdc("0.10")).toBe(100_000n);
    expect(parseUsdc("4.50")).toBe(4_500_000n);
    expect(parseUsdc("0.50")).toBe(500_000n);
    expect(parseUsdc("48.6")).toBe(48_600_000n);
    expect(parseUsdc("5.4")).toBe(5_400_000n);
    expect(parseUsdc("19.44")).toBe(19_440_000n);
    expect(parseUsdc("14.58")).toBe(14_580_000n);
    expect(parseUsdc("0.108")).toBe(108_000n);

    expect(formatUsdc(48_600_000n)).toBe("48.6");
    expect(formatUsdc(5_400_000n)).toBe("5.4");
    expect(formatUsdc(19_440_000n)).toBe("19.44");
    expect(formatUsdc(108_000n)).toBe("0.108");
    expect(formatUsdc(1_000_000n)).toBe("1");
  });

  it("rejects malformed or over-precise decimals", () => {
    expect(() => parseUsdc("-1")).toThrow(/Invalid USDC amount/);
    expect(() => parseUsdc("1.1234567")).toThrow(/Invalid USDC amount/);
    expect(() => parseUsdc("1.2.3")).toThrow(/Invalid USDC amount/);
    expect(() => parseUsdc("")).toThrow(/Invalid USDC amount/);
  });
});

describe("splitGrossBuy", () => {
  it("uses 90/8/2 basis points", () => {
    expect(BUY_SPLIT_BPS.prizePool).toBe(9_000);
    expect(BUY_SPLIT_BPS.studioNet).toBe(800);
    expect(BUY_SPLIT_BPS.novaBudget).toBe(200);
    expect(
      BUY_SPLIT_BPS.prizePool +
        BUY_SPLIT_BPS.studioNet +
        BUY_SPLIT_BPS.novaBudget,
    ).toBe(BPS_DENOMINATOR);
  });

  it("keeps prize + studio net + nova budget == gross", () => {
    for (const decimal of ["1", "5", "10", "60", "0.000001"]) {
      const split = splitGrossBuy(parseUsdc(decimal));
      expect(split.studioNet + split.prizePool + split.novaBudget).toBe(
        split.gross,
      );
    }
  });

  it("quotes Spark 0.90 / 0.08 / 0.02 and Pulse 4.50 / 0.40 / 0.10", () => {
    const spark = splitGrossBuy(parseUsdc("1"));
    expect(formatUsdc(spark.prizePool)).toBe("0.9");
    expect(formatUsdc(spark.studioNet)).toBe("0.08");
    expect(formatUsdc(spark.novaBudget)).toBe("0.02");

    const pulse = splitGrossBuy(parseUsdc("5"));
    expect(formatUsdc(pulse.prizePool)).toBe("4.5");
    expect(formatUsdc(pulse.studioNet)).toBe("0.4");
    expect(formatUsdc(pulse.novaBudget)).toBe("0.1");
  });

  it("sends integer dust to the prize pool so studio and budget never exceed their bps", () => {
    const split = splitGrossBuy(1n);
    expect(split.studioNet).toBe(0n);
    expect(split.novaBudget).toBe(0n);
    expect(split.prizePool).toBe(1n);
  });

  it("rejects negative gross", () => {
    expect(() => splitGrossBuy(-1n)).toThrow(/non-negative/);
  });
});

describe("day 90/10 split", () => {
  it("splits P=54 into 48.6 paid / 5.4 free", () => {
    const { paidWinnerBucket, freeWinnerBucket } = splitAmountByBps(
      parseUsdc("54"),
      { paidWinners: 9_000, freeWinners: 1_000 },
    );
    expect(formatUsdc(paidWinnerBucket)).toBe("48.6");
    expect(formatUsdc(freeWinnerBucket)).toBe("5.4");
    expect(paidWinnerBucket + freeWinnerBucket).toBe(parseUsdc("54"));
  });
});
