import { describe, expect, it } from "vitest";
import { containsForbiddenFinanceTerm } from "@nova/shared";
import {
  buyPack,
  castSelected,
  createDayState,
  formatLocalTime,
  selectChoice,
  setExtraSpendAmount,
  setSpendAmount,
} from "../day/dayStore";
import { buildHomeModel, buildVoteModel } from "./homeHudModel";

const now = new Date("2026-09-18T12:00:00");
const DAY_1 = createDayState(1, now);

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

  it("leads to Vote with the close time, then to the locked vote after a cast", () => {
    const open = buildHomeModel(DAY_1);
    expect(open.locked).toBe(false);
    expect(open.ctaLabel).toBe(
      `Choose and vote · closes ${formatLocalTime(DAY_1.schedule.voteCloseAt)}`,
    );

    const cast = buildHomeModel(castSelected(selectChoice(DAY_1, "B")));
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
    let state = buyPack(selectChoice(DAY_1, "A"), "spark");
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
    const model = buildVoteModel(castSelected(selectChoice(DAY_1, "B")));
    expect(model.locked).toBe(true);
    expect(model.castLabel).toBe("Vote locked · view");
    expect(model.spendAmount).toBe(10);
    expect(model.freeMeta).toBe("0 left of 10");
    expect(model.canIncreaseFree || model.canDecreaseFree).toBe(false);
    expect(model.buyEntry).toBeNull();
  });
});
