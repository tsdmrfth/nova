import { describe, expect, it } from "vitest";
import { DAY_GOALS, dayGoalFor, pickWinningOption } from "./dayGoal";

describe("dayGoalFor", () => {
  it("rotates MOST / LEAST / MIDDLE from Day 1", () => {
    expect(DAY_GOALS).toEqual(["MOST", "LEAST", "MIDDLE"]);
    expect(dayGoalFor(1)).toBe("MOST");
    expect(dayGoalFor(2)).toBe("LEAST");
    expect(dayGoalFor(3)).toBe("MIDDLE");
    expect(dayGoalFor(4)).toBe("MOST");
    expect(dayGoalFor(5)).toBe("LEAST");
    expect(dayGoalFor(6)).toBe("MIDDLE");
    expect(dayGoalFor(10)).toBe("MOST");
  });

  it("rejects non-positive days", () => {
    expect(() => dayGoalFor(0)).toThrow(/>= 1/);
    expect(() => dayGoalFor(-1)).toThrow(/non-negative integer/);
    expect(() => dayGoalFor(1.5)).toThrow(/non-negative integer/);
  });
});

describe("pickWinningOption", () => {
  const optionIds = ["A", "B", "C"] as const;
  const tallies = [
    { optionId: "A", free: 20 },
    { optionId: "B", free: 50 },
    { optionId: "C", free: 30 },
  ];

  it("scores MOST / LEAST / MIDDLE from Free weight only", () => {
    expect(
      pickWinningOption({ goal: "MOST", optionIds, casts: tallies }),
    ).toBe("B");
    expect(
      pickWinningOption({ goal: "LEAST", optionIds, casts: tallies }),
    ).toBe("A");
    expect(
      pickWinningOption({ goal: "MIDDLE", optionIds, casts: tallies }),
    ).toBe("C");
  });

  it("does not let Extra pick W*", () => {
    const withWhale = [
      ...tallies,
      { optionId: "A", free: 0 },
    ];
    expect(
      pickWinningOption({
        goal: "MOST",
        optionIds,
        casts: [
          ...withWhale,
          { optionId: "A", free: 0 },
          { optionId: "A", free: 0 },
        ],
      }),
    ).toBe("B");
  });

  it("breaks equal Free ties by optionId ascending", () => {
    const tied = [
      { optionId: "A", free: 10 },
      { optionId: "B", free: 10 },
      { optionId: "C", free: 4 },
    ];
    expect(pickWinningOption({ goal: "MOST", optionIds, casts: tied })).toBe(
      "A",
    );
    expect(pickWinningOption({ goal: "MIDDLE", optionIds, casts: tied })).toBe(
      "B",
    );
    expect(pickWinningOption({ goal: "LEAST", optionIds, casts: tied })).toBe(
      "C",
    );
  });
});
