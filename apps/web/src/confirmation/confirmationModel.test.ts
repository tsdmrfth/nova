import { describe, expect, it } from "vitest";
import { containsForbiddenFinanceTerm, grantDailyFree } from "@nova/shared";
import {
  buyPack,
  castSelected,
  createDayState,
  formatLocalStamp,
  selectChoice,
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
    expect(model.choiceLine).toBe("");
    expect(model.freeOnPick).toBe("Not cast");
    expect(model.freeRemaining).toBe(`${grantDailyFree()} remaining`);
    expect(model.extraOnPick).toBe("Not cast");
    expect(model.extraRemaining).toBe("0 remaining");
    expect(model.closeLine).toBe(
      `Voting closes ${formatLocalStamp(state.schedule.voteCloseAt)}`,
    );
    expect(model.publishLine).toBe(
      `Results publish ${formatLocalStamp(state.schedule.publishAt)}`,
    );
  });

  it("summarizes Free vs Extra on the locked pick", () => {
    let state = createDayState(1, now);
    state = buyPack(state, "spark");
    state = selectChoice(state, "B");
    state = castSelected(state);
    const model = buildConfirmationModel(state);
    expect(model.locked).toBe(true);
    expect(model.resultsReady).toBe(true);
    expect(model.title).toBe("Vote locked");
    expect(model.dayLine).toBe("Day 01 · MOST");
    expect(model.choiceLine).toBe("Expand · Say hello");
    expect(model.freeOnPick).toBe("10 on this pick");
    expect(model.freeRemaining).toBe("0 remaining");
    expect(model.extraOnPick).toBe("10 on this pick");
    expect(model.extraRemaining).toBe("10 remaining");
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
