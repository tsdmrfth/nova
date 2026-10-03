import { describe, expect, it } from "vitest";
import { grantDailyFree } from "@nova/shared";
import {
  EMPTY_DAY_UI,
  canCast,
  createDayState,
  dayStateFromChain,
  formatLocalStamp,
  selectChoice,
  setExtraSpendAmount,
  setSpendAmount,
} from "./dayStore";
import { FIXTURE_ACCOUNT, FIXTURE_NOW, chainDay, dayState, votedState } from "../test/dayFixtures";

describe("day store from the pool", () => {
  it("opens Day 1 with a Free grant and MOST goal", () => {
    const state = dayState();
    expect(state.day).toBe(1);
    expect(state.goal).toBe("MOST");
    expect(state.roundTitle).toBe("First light");
    expect(state.freeInfluence).toBe(grantDailyFree());
    expect(state.extraInfluence).toBe(0);
    expect(state.status).toBe("open");
    expect(state.votingOpen).toBe(true);
    expect(state.choices.map((choice) => choice.world)).toEqual([
      "Stabilize",
      "Expand",
      "Route",
    ]);
    expect(canCast(state)).toBe(false);
  });

  it("keeps voting shut until the pool has been read", () => {
    const state = selectChoice(createDayState(1), "A");
    expect(state.votingOpen).toBe(false);
    expect(canCast(state)).toBe(false);
  });

  it("reads the vote, the remaining Free and the placed Extra from the pool", () => {
    const state = votedState("A", 7, 4, 10);
    expect(state.status).toBe("cast");
    expect(state.selected).toBe("A");
    expect(state.freeInfluence).toBe(3);
    expect(state.spendAmount).toBe(3);
    expect(state.extraInfluence).toBe(10);
    expect(state.extraSpendAmount).toBe(4);
    expect(state.casts).toEqual([{ walletId: FIXTURE_ACCOUNT, optionId: "A", extra: 4, free: 7 }]);
    expect(selectChoice(state, "B").selected).toBe("A");
  });

  it("defaults the Extra stepper to everything bought and keeps Free separate", () => {
    let state = dayState({ spentMicro: 1_000_000n, entry: { extraBought: 10 } });
    expect(state.extraSpendAmount).toBe(10);
    expect(state.spendAmount).toBe(10);
    expect(state.spentTodayMicro).toBe(1_000_000n);
    state = setExtraSpendAmount(state, 4);
    state = setSpendAmount(state, 2);
    state = selectChoice(state, "C");
    expect(canCast(state)).toBe(true);
    expect(state).toMatchObject({ spendAmount: 2, extraSpendAmount: 4, freeInfluence: 10, extraInfluence: 10 });
  });

  it("clamps local picks to what the pool allows", () => {
    const state = dayState({ entry: { extraBought: 10 } }, { spendAmount: 99, extraSpendAmount: 50 });
    expect(state.spendAmount).toBe(10);
    expect(state.extraSpendAmount).toBe(10);
    expect(setSpendAmount(state, -1).spendAmount).toBe(0);
  });

  it("closes voting once the pool day closes or settles", () => {
    const closed = dayState({ closesAt: FIXTURE_NOW - 1 }, { selected: "B" });
    expect(closed.votingOpen).toBe(false);
    expect(canCast(closed)).toBe(false);

    const settled = dayStateFromChain(chainDay({ open: false, settled: true }), EMPTY_DAY_UI, null);
    expect(settled.votingOpen).toBe(false);
    expect(settled.settled).toBe(true);
  });

  it("formats the pool close time in device local", () => {
    const state = dayState({ closesAt: FIXTURE_NOW + 3_600_000 });
    expect(state.schedule.voteCloseAt).toBe(FIXTURE_NOW + 3_600_000);
    expect(formatLocalStamp(FIXTURE_NOW).length).toBeGreaterThan(4);
  });
});
