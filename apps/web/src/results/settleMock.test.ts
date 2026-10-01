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
  confirmClaim,
  createDayState,
  castSelected,
  failClaim,
  LOCAL_PLAYER_ID,
  selectChoice,
} from "../day/dayStore";
import { formatCheckoutUsdc } from "../buy/buyModel";
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

  it("renders a miss as Not this round with zero shares and no claim", () => {
    const state = castOn("A");
    const result = settleOffline(state);
    const model = buildResultsModel(state, result);
    expect(result.correct).toBe(false);
    expect(result.player.total).toBe(0n);
    expect(model.variant).toBe(result.rolledOver ? "rollover" : "miss");
    expect(model.title).toBe(RESULTS_COPY.missTitle);
    expect(model.winnerId).toBe("B");
    expect(model.pickId).toBe("A");
    expect(model.yourExtra).toBe("0.00 USDC");
    expect(model.yourFree).toBe("0.00 USDC");
    expect(model.claimEnabled).toBe(false);
    expect(model.teaseTitle).toBe("Chapter 02 opens tomorrow");
    // SPARK still settles in the model even though the kit drops its row.
    expect(result.spark.spark).toBe(SPARK_TABLE.dailyVoteLock);
  });

  it("asks for a cast before showing shares on an empty day", () => {
    const model = buildResultsModel(createDayState(1, now));
    expect(model.variant).toBe("needCast");
    expect(model.pickId).toBeNull();
    expect(model.claimEnabled).toBe(false);
  });

  it("shows the day pool, both lanes, and the claimable total after a Pulse buy on the winner", () => {
    const state = castOn("B", "pulse");
    const result = settleOffline(state);
    const model = buildResultsModel(state, result);
    expect(result.player.paid).toBeGreaterThan(0n);
    expect(result.player.free).toBeGreaterThan(0n);
    expect(model.variant).toBe("matched");
    expect(model.title).toBe("You matched!");
    expect(model.paidLaneLabel).toBe("Paid lane · 90%");
    expect(model.freeLaneLabel).toBe("Free lane · 10%");
    expect(model.dayPool).toBe(`${formatCheckoutUsdc(result.pool.prizePool)} USDC`);
    expect(model.claimable).toBe(`${formatCheckoutUsdc(result.player.total)} USDC`);
    expect(model.claimCta).toBe(RESULTS_COPY.claim(formatCheckoutUsdc(result.player.total)));
    expect(model.claimEnabled).toBe(true);
  });

  it("moves a claim through pending to claimed or failed, and retries after failure", () => {
    const state = castOn("B");
    const result = settleOffline(state);
    const snapshot = {
      paid: result.player.paid,
      free: result.player.free,
      total: result.player.total,
      spark: result.spark.spark,
      winningOptionId: result.winningOptionId,
    };
    const pending = claimPayout(state, snapshot);
    expect(pending.claimStatus).toBe("pending");
    expect(buildResultsModel(pending).claimEnabled).toBe(false);
    expect(claimPayout(pending, snapshot)).toBe(pending);

    const claimed = confirmClaim(pending);
    expect(claimed.claimStatus).toBe("claimed");
    expect(buildResultsModel(claimed).claimCta).toBe(RESULTS_COPY.claimed);

    const failed = failClaim(pending);
    expect(failed.claimStatus).toBe("failed");
    expect(buildResultsModel(failed).claimEnabled).toBe(true);
    expect(claimPayout(failed, snapshot).claimStatus).toBe("pending");

    const blob = [JSON.stringify(RESULTS_COPY), buildResultsModel(claimed).title].join(" ");
    expect(containsForbiddenFinanceTerm(blob)).toBeUndefined();
    expect(blob.toLowerCase()).not.toMatch(/\bapr\b|\bodds\b|\brtp\b/);
  });
});
