import { describe, expect, it } from "vitest";
import { containsForbiddenFinanceTerm, grantDailyFree } from "@nova/shared";
import { formatLocalTime } from "../day/dayStore";
import { FIXTURE_NOW, dayState, votedState } from "../test/dayFixtures";
import { buildConfirmationModel } from "./confirmationModel";

describe("confirmation model", () => {
  it("reads an open day without inventing a cast", () => {
    const model = buildConfirmationModel(dayState());
    expect(model.locked).toBe(false);
    expect(model.resultsReady).toBe(false);
    expect(model.title).toBe("Nothing locked yet");
    expect(model.pick).toBeNull();
    expect(model.freeSpent).toBe(0);
    expect(model.freeRemaining).toBe(grantDailyFree());
    expect(model.extraSpent).toBe(0);
    expect(model.extraRemaining).toBe(0);
    expect(model.closesAt).toBe("At settle");
    expect(model.publishAt).toBe("After settle");
    expect(model.resultsCta).toBe("Results after the day settles");
    expect(model.canBuy).toBe(true);

    const closesAt = FIXTURE_NOW + 3_600_000;
    expect(buildConfirmationModel(dayState({ closesAt })).closesAt).toBe(formatLocalTime(closesAt));
  });

  it("summarizes Free vs Extra on the locked pick", () => {
    const model = buildConfirmationModel(votedState("B", 10, 4, 10));
    expect(model.locked).toBe(true);
    expect(model.resultsReady).toBe(false);
    expect(model.title).toBe("Vote locked");
    expect(model.dayLabel).toBe("DAY 01");
    expect(model.pick).toEqual({ id: "B", label: "Say hello" });
    expect(model.freeSpent).toBe(10);
    expect(model.freeRemaining).toBe(0);
    expect(model.extraSpent).toBe(4);
    expect(model.extraRemaining).toBe(6);
    expect(model.canBuy).toBe(false);

    const settled = buildConfirmationModel(
      dayState({ open: false, settled: true, entry: { voted: true, option: "B", free: 10 } }),
    );
    expect(settled.resultsReady).toBe(true);
    expect(settled.resultsCta).toBe("See results");
  });

  it("keeps confirmation copy free of yield and odds claims", () => {
    const model = buildConfirmationModel(votedState("A", 10));
    const blob = JSON.stringify(model);
    expect(containsForbiddenFinanceTerm(blob)).toBeUndefined();
    expect(blob).not.toMatch(/Submit vote/i);
    expect(blob.toLowerCase()).not.toMatch(/partnered with circle|official architects/);
  });
});
