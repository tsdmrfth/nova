import { containsForbiddenFinanceTerm } from "@nova/shared";
import { describe, expect, it } from "vitest";
import { GUIDE_COPY } from "./guideCopy";

describe("guide copy", () => {
  it("states the rules with the numbers from @nova/shared", () => {
    expect(GUIDE_COPY.day.votes).toBe(10);
    expect(GUIDE_COPY.extra.packs.map((pack) => [pack.name, pack.price, pack.extra])).toEqual([
      ["Spark", "1", "10 Extra"],
      ["Pulse", "5", "55 Extra"],
    ]);
    expect(GUIDE_COPY.extra.caps).toEqual([
      "Up to 10 USDC of Extra a day",
      "Up to 100 Extra counts toward your share",
    ]);
    expect(GUIDE_COPY.pool.split.map((part) => [part.pct, part.amount])).toEqual([
      [90, "0.9 USDC"],
      [8, "0.08 USDC"],
      [2, "0.02 USDC"],
    ]);
    expect(GUIDE_COPY.pool.lanes.map((lane) => lane.pct)).toEqual(["90%", "10%"]);
    expect(GUIDE_COPY.nova.body).toMatch(/2% of every Extra buy goes to the Nova operating budget/);
  });

  it("picks the example winner with the real goal rule", () => {
    expect(GUIDE_COPY.goal.exampleWinner("MOST")).toBe("A");
    expect(GUIDE_COPY.goal.exampleWinner("LEAST")).toBe("C");
    expect(GUIDE_COPY.goal.exampleWinner("MIDDLE")).toBe("B");
  });

  it("splits the share example with the real allocator", () => {
    expect(GUIDE_COPY.pool.shareExample.map((row) => row.payout)).toEqual(["≈ 0.67 USDC", "≈ 0.33 USDC"]);
  });

  it("keeps the soft-launch honesty lines and no APR / odds wording", () => {
    expect(GUIDE_COPY.extra.doesnt).toBe("Never changes which choice wins.");
    expect(GUIDE_COPY.pool.rollover).toMatch(/the pool is zero/);
    expect(GUIDE_COPY.finePrint.join(" ")).toMatch(/not affiliated with or endorsed by Circle/);
    expect(containsForbiddenFinanceTerm(JSON.stringify(GUIDE_COPY))).toBeUndefined();
  });
});
