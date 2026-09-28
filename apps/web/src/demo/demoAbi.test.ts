import { describe, expect, it } from "vitest";
import {
  APPROVE_SELECTOR,
  BUY_EXTRA_INFLUENCE_SELECTOR,
  PACK_ON_CHAIN,
  SNAPSHOT_SELECTOR,
  decodePoolSnapshot,
  decodeSignalSnapshot,
  encodeApprove,
  encodeBuy,
  encodeUint256,
} from "./demoAbi";

describe("demo ABI", () => {
  it("locks selectors produced by cast sig", () => {
    expect(APPROVE_SELECTOR).toBe("0x095ea7b3");
    expect(BUY_EXTRA_INFLUENCE_SELECTOR).toBe("0x6b6daf59");
    expect(SNAPSHOT_SELECTOR).toBe("0x9711715a");
    expect(PACK_ON_CHAIN).toEqual({ spark: 1, pulse: 2 });
  });

  it("encodes an approve and a Spark buy", () => {
    const spender = "0x1111111111111111111111111111111111111111";
    const approve = encodeApprove(spender, 1_000_000n);
    expect(approve.startsWith(APPROVE_SELECTOR)).toBe(true);
    expect(approve).toContain("1111111111111111111111111111111111111111");
    expect(approve.endsWith(encodeUint256(1_000_000n))).toBe(true);
    expect(encodeBuy(1)).toBe(`${BUY_EXTRA_INFLUENCE_SELECTOR}${encodeUint256(1n)}`);
  });

  it("decodes pool and signal snapshots", () => {
    const word = (value: bigint) => value.toString(16).padStart(64, "0");
    const pool = decodePoolSnapshot(
      `0x${word(60_000_000n)}${word(54_000_000n)}${word(4_800_000n)}${word(1_200_000n)}${word(1n)}${word(0n)}${word(1n)}${word(1_200_000n)}${word(20_000n)}`,
    );
    expect(pool?.prize).toBe(54_000_000n);
    expect(pool?.studioNet).toBe(4_800_000n);
    expect(pool?.novaBudget).toBe(1_200_000n);
    expect(pool?.settled).toBe(true);
    expect(pool?.dayOpen).toBe(false);
    expect(pool?.novaBudgetSpent).toBe(20_000n);

    const signal = decodeSignalSnapshot(
      `0x${word(0xabcden)}${word(1_000_000n)}${word(20_000n)}${word(980_000n)}`,
    );
    expect(signal?.wallet.endsWith("abcde")).toBe(true);
    expect(signal?.signaled).toBe(20_000n);
    expect(signal?.remainingCap).toBe(980_000n);
  });
});
