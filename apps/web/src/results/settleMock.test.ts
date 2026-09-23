import { describe, expect, it } from "vitest";
import {
  buildDayPrizePool,
  containsForbiddenFinanceTerm,
  formatUsdc,
  payoutsByWallet,
  pickWinningOption,
  settleDay,
  SPARK_TABLE,
} from "@nova/shared";
import {
  buyPack,
  claimPayout,
  createDayState,
  castSelected,
  LOCAL_PLAYER_ID,
  selectChoice,
} from "../day/dayStore";
import { CROWD_PACKS, crowdCasts } from "./crowdMock";
import { buildResultsModel, RESULTS_COPY } from "./resultsModel";
import { settleOffline } from "./settleMock";

const now = new Date("2026-09-18T12:00:00");

function castOn(
  option: "A" | "B" | "C",
  buy?: "spark" | "pulse",
) {
  let state = createDayState(1, now);
  if (buy) {
    state = buyPack(state, buy);
  }
  state = selectChoice(state, option);
  return castSelected(state);
}

describe("offline settle mock", () => {
  it("picks Expand (B) for Day 1 MOST from Free tallies only", () => {
    const state = createDayState(1, now);
    const crowd = crowdCasts();
    expect(
      pickWinningOption({
        goal: state.goal,
        optionIds: ["A", "B", "C"],
        casts: crowd,
      }),
    ).toBe("B");

    const whale = settleOffline(state);
    const withWhale = settleDay({
      prizePool: whale.pool.prizePool,
      winningOptionId: pickWinningOption({
        goal: "MOST",
        optionIds: ["A", "B", "C"],
        casts: [...crowd, { walletId: "whale", optionId: "A", extra: 10_000, free: 0 }],
      }),
      casts: [...crowd, { walletId: "whale", optionId: "A", extra: 10_000, free: 0 }],
    });
    expect(withWhale.winningOptionId).toBe("B");
  });

  it("runs prize pool + buckets through shared for the crowd packs", () => {
    const pool = buildDayPrizePool({ packs: CROWD_PACKS });
    expect(formatUsdc(pool.prizePool)).toBe("54");
    expect(formatUsdc(pool.paidWinnerBucket)).toBe("48.6");
    expect(formatUsdc(pool.freeWinnerBucket)).toBe("5.4");
    expect(settleOffline(createDayState(1, now)).pool.prizePool).toBe(pool.prizePool);
  });

  it("pays a correct Free cast from the free bucket", () => {
    const state = castOn("B");
    const result = settleOffline(state);
    expect(result.winningOptionId).toBe("B");
    expect(result.correct).toBe(true);
    expect(result.player.free).toBeGreaterThan(0n);
    expect(result.player.paid).toBe(0n);
    expect(result.spark.spark).toBe(
      SPARK_TABLE.dailyVoteLock + SPARK_TABLE.correctPrediction,
    );

    const expected = settleDay({
      prizePool: result.pool.prizePool,
      winningOptionId: "B",
      casts: [...crowdCasts(), ...state.casts],
    });
    const local = payoutsByWallet(expected).find(
      (row) => row.walletId === LOCAL_PLAYER_ID,
    );
    expect(result.player.free).toBe(local?.free);
  });

  it("hides paid/free 0 rows on a miss and still awards lock SPARK", () => {
    const state = castOn("A");
    const result = settleOffline(state);
    const model = buildResultsModel(state, result);
    expect(result.correct).toBe(false);
    expect(result.player.total).toBe(0n);
    expect(model.shareRows).toEqual([]);
    expect(model.miss).toBe(RESULTS_COPY.miss);
    expect(model.claimEnabled).toBe(false);
    expect(model.spark).toBe(SPARK_TABLE.dailyVoteLock);
  });

  it("shows both share lanes after a Pulse buy on the winner", () => {
    const state = castOn("B", "pulse");
    const result = settleOffline(state);
    const model = buildResultsModel(state, result);
    expect(result.player.paid).toBeGreaterThan(0n);
    expect(result.player.free).toBeGreaterThan(0n);
    expect(model.shareRows.map((row) => row.id)).toEqual(["paid", "free"]);
    expect(model.claimCta).toBe(
      RESULTS_COPY.claim(formatUsdc(result.player.total)),
    );
    expect(model.canon).toBe("Canon today: Say hello");
    expect(model.goalLine).toBe("Day goal was MOST");
    expect(model.hook).toBe("Neighbors notice a wave.");
  });

  it("freezes the claim snapshot and keeps copy hukuk-safe", () => {
    const state = castOn("B");
    const result = settleOffline(state);
    const claimed = claimPayout(state, {
      paid: result.player.paid,
      free: result.player.free,
      total: result.player.total,
      spark: result.spark.spark,
      winningOptionId: result.winningOptionId,
    });
    expect(claimed.claimStatus).toBe("claimed");
    expect(buildResultsModel(claimed).claimCta).toBe(RESULTS_COPY.claimed);
    const blob = [
      JSON.stringify(RESULTS_COPY),
      buildResultsModel(claimed).canon,
      buildResultsModel(claimed).claimCta,
      buildResultsModel(claimed).sparkHint,
    ].join(" ");
    expect(containsForbiddenFinanceTerm(blob)).toBeUndefined();
    expect(blob.toLowerCase()).not.toMatch(/\bapr\b|\bodds\b|\brtp\b/);
  });
});
