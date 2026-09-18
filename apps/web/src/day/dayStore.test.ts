import { describe, expect, it } from "vitest";
import { grantDailyFree } from "@nova/shared";
import {
  canCast,
  castSelected,
  createDayState,
  formatLocalStamp,
  LOCAL_PLAYER_ID,
  buyPack,
  selectChoice,
  setSpendAmount,
  stubVoteSchedule,
} from "./dayStore";

describe("in-memory day store", () => {
  const now = new Date("2026-09-18T12:00:00");

  it("opens Day 1 with a Free grant and MOST goal", () => {
    const state = createDayState(1, now);
    expect(state.day).toBe(1);
    expect(state.goal).toBe("MOST");
    expect(state.roundTitle).toBe("First light");
    expect(state.freeInfluence).toBe(grantDailyFree());
    expect(state.extraInfluence).toBe(0);
    expect(state.status).toBe("open");
    expect(state.choices.map((choice) => choice.world)).toEqual([
      "Stabilize",
      "Expand",
      "Route",
    ]);
    expect(canCast(state)).toBe(false);
  });

  it("spends Free Influence onto the selected tile", () => {
    let state = createDayState(1, now);
    state = selectChoice(state, "A");
    state = setSpendAmount(state, 7);
    expect(canCast(state)).toBe(true);
    state = castSelected(state);
    expect(state.status).toBe("cast");
    expect(state.freeInfluence).toBe(3);
    expect(state.spendAmount).toBe(3);
    expect(state.casts).toEqual([
      {
        walletId: LOCAL_PLAYER_ID,
        optionId: "A",
        extra: 0,
        free: 7,
      },
    ]);
  });

  it("clamps overspend, ignores casts without a tile, and locks after one cast", () => {
    let state = createDayState(1, now);
    expect(castSelected(state)).toEqual(state);
    state = setSpendAmount(state, 99);
    expect(state.spendAmount).toBe(10);
    state = selectChoice(state, "B");
    state = castSelected(state);
    const locked = selectChoice(state, "C");
    expect(locked.selected).toBe("B");
    expect(castSelected(state).casts).toHaveLength(1);
  });

  it("formats the stub close/publish times in device local", () => {
    const schedule = stubVoteSchedule(now);
    expect(schedule.publishAt - schedule.voteCloseAt).toBe(2 * 60 * 60 * 1000);
    expect(formatLocalStamp(schedule.voteCloseAt).length).toBeGreaterThan(4);
  });

  it("credits Extra via attemptBuy without mixing Free", () => {
    let state = createDayState(1, now);
    state = buyPack(state, "spark");
    expect(state.freeInfluence).toBe(grantDailyFree());
    expect(state.extraInfluence).toBe(10);
    expect(state.spentTodayMicro).toBe(1_000_000n);
    expect(state.lastBuy).toEqual({
      ok: true,
      packId: "spark",
      extraInfluence: 10,
    });

    state = buyPack(state, "pulse");
    expect(state.extraInfluence).toBe(65);
    expect(state.freeInfluence).toBe(10);

    state = buyPack(state, "pulse");
    expect(state.extraInfluence).toBe(65);
    expect(state.lastBuy?.ok).toBe(false);
    expect(state.lastBuy?.code).toBe("DAILY_BUY_CAP_EXCEEDED");
  });
});
