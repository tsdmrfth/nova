import { describe, expect, it } from "vitest";
import { containsForbiddenFinanceTerm } from "@nova/shared";
import {
  formatLocalTime,
  selectChoice,
  setExtraSpendAmount,
  setSpendAmount,
} from "../day/dayStore";
import { FIXTURE_NOW, dayState, votedState } from "../test/dayFixtures";
import { buildHomeModel, buildVoteModel } from "./homeHudModel";

const DAY_1 = dayState();

describe("home model (screen 05)", () => {
  it("uses Day 1 First light copy on A / B / C", () => {
    const model = buildHomeModel(DAY_1);
    expect(model.dayLabel).toBe("DAY 01");
    expect(model.goal).toBe("MOST");
    expect(model.freeInfluence).toBe(10);
    expect(model.extraInfluence).toBe(0);
    expect(model.chapterLabel).toBe("CHAPTER 01");
    expect(model.title).toBe("First light");
    expect(model.scene).toMatch(/three paths glow/i);
    expect(model.choices.map((choice) => [choice.id, choice.label])).toEqual([
      ["A", "Listen first"],
      ["B", "Say hello"],
      ["C", "Find your place"],
    ]);
  });

  it("leads to Vote with the pool close time, then to the locked vote after a cast", () => {
    expect(buildHomeModel(DAY_1).ctaLabel).toBe("Choose and vote");
    const closesAt = FIXTURE_NOW + 3_600_000;
    const open = buildHomeModel(dayState({ closesAt }));
    expect(open.locked).toBe(false);
    expect(open.ctaLabel).toBe(`Choose and vote · closes ${formatLocalTime(closesAt)}`);
    expect(buildHomeModel(dayState({ open: false, settled: true })).ctaLabel).toBe(
      "Voting closed · see results",
    );

    const cast = buildHomeModel(votedState("B", 10));
    expect(cast.locked).toBe(true);
    expect(cast.ctaLabel).toBe("View your vote");
    expect(cast.choices.find((choice) => choice.selected)?.id).toBe("B");
  });

  it("does not use guaranteed-yield language", () => {
    const blob = JSON.stringify([buildHomeModel(DAY_1), buildVoteModel(DAY_1)]);
    expect(containsForbiddenFinanceTerm(blob)).toBeUndefined();
    expect(blob.toLowerCase()).not.toMatch(/partnered with circle/);
    expect(blob.toLowerCase()).not.toMatch(/official architects/);
  });
});

describe("vote model (screen 06)", () => {
  it("keeps Cast disabled until a pick is made", () => {
    const model = buildVoteModel(DAY_1);
    expect(model.castEnabled).toBe(false);
    expect(model.castLabel).toBe("Pick A, B or C");
    expect(model.freeMeta).toBe("0 left of 10");
    expect(model.extraMeta).toBe("0 left of 0");
    expect(model.canIncreaseExtra).toBe(false);

    const picked = buildVoteModel(selectChoice(DAY_1, "C"));
    expect(picked.castEnabled).toBe(true);
    expect(picked.castLabel).toBe("Cast Influence on C");
  });

  it("runs Free and Extra as two independent steppers", () => {
    let state = selectChoice(dayState({ entry: { extraBought: 10 } }), "A");
    state = setSpendAmount(state, 4);
    state = setExtraSpendAmount(state, 3);
    const model = buildVoteModel(state);
    expect(model.spendAmount).toBe(4);
    expect(model.extraSpendAmount).toBe(3);
    expect(model.freeMeta).toBe("6 left of 10");
    expect(model.extraMeta).toBe("7 left of 10");
    expect(model.canIncreaseFree && model.canDecreaseFree).toBe(true);
    expect(model.canIncreaseExtra && model.canDecreaseExtra).toBe(true);
  });

  it("prompts Need more Extra Influence when Extra is 0 (UI-KIT-V2 guardrail 1)", () => {
    const model = buildVoteModel(DAY_1);
    expect(model.buyEntry).toBe("Need more Extra Influence?");
    expect(model.buyEntryToBuy).toBe(true);
  });

  it("goes read-only after the cast", () => {
    const model = buildVoteModel(votedState("B", 10));
    expect(model.locked).toBe(true);
    expect(model.castLabel).toBe("Vote locked · view");
    expect(model.spendAmount).toBe(10);
    expect(model.freeMeta).toBe("0 left of 10");
    expect(model.canIncreaseFree || model.canDecreaseFree).toBe(false);
    expect(model.buyEntry).toBeNull();
  });
});
