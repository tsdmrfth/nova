import { describe, expect, it } from "vitest";
import { containsForbiddenFinanceTerm, grantDailyFree } from "@nova/shared";
import {
  buyPack,
  castSelected,
  createDayState,
  formatLocalTime,
  selectChoice,
  setExtraSpendAmount,
} from "../day/dayStore";
import { buildConfirmationModel } from "./confirmationModel";

const now = new Date("2026-09-18T12:00:00");

describe("confirmation model", () => {
  it("reads an open day without inventing a cast", () => {
    const state = createDayState(1, now);
    const model = buildConfirmationModel(state);
    expect(model.locked).toBe(false);
    expect(model.resultsReady).toBe(false);
    expect(model.title).toBe("Nothing locked yet");
    expect(model.pick).toBeNull();
    expect(model.freeSpent).toBe(0);
    expect(model.freeRemaining).toBe(grantDailyFree());
    expect(model.extraSpent).toBe(0);
    expect(model.extraRemaining).toBe(0);
    expect(model.closesAt).toBe(formatLocalTime(state.schedule.voteCloseAt));
    expect(model.publishAt).toBe(formatLocalTime(state.schedule.publishAt));
    expect(model.resultsCta).toBe(`See results · ${model.publishAt}`);
  });

  it("summarizes Free vs Extra on the locked pick", () => {
    let state = createDayState(1, now);
    state = buyPack(state, "spark");
    state = selectChoice(state, "B");
    state = setExtraSpendAmount(state, 4);
    state = castSelected(state);
    const model = buildConfirmationModel(state);
    expect(model.locked).toBe(true);
    expect(model.resultsReady).toBe(true);
    expect(model.title).toBe("Vote locked");
    expect(model.dayLabel).toBe("DAY 01");
    expect(model.pick).toEqual({ id: "B", label: "Say hello" });
    expect(model.freeSpent).toBe(10);
    expect(model.freeRemaining).toBe(0);
    expect(model.extraSpent).toBe(4);
    expect(model.extraRemaining).toBe(6);
    expect(model.resultsCta).toBe("See results");
  });

  it("keeps confirmation copy free of yield and odds claims", () => {
    const model = buildConfirmationModel(
      castSelected(selectChoice(createDayState(1, now), "A")),
    );
    const blob = JSON.stringify(model);
    expect(containsForbiddenFinanceTerm(blob)).toBeUndefined();
    expect(blob).not.toMatch(/Submit vote/i);
    expect(blob.toLowerCase()).not.toMatch(/partnered with circle|official architects/);
  });
});
