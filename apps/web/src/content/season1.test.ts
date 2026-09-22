import { describe, expect, it } from "vitest";
import { containsForbiddenFinanceTerm, dayGoalFor } from "@nova/shared";
import { S1_COPY } from "./s1Copy";
import {
  DEFAULT_SEASON_DAY,
  getSeasonDay,
  parseSeasonDay,
  playerFacingIfWins,
  S1_BARS,
  S1_DAY_1,
  SEASON_1_DAYS,
  SEASON_1_LENGTH,
  withYesterdayWinner,
  type PersonalityBar,
} from "./season1";

const EXPECTED_GOALS = [
  "MOST",
  "LEAST",
  "MIDDLE",
  "MOST",
  "LEAST",
  "MIDDLE",
  "MOST",
  "LEAST",
  "MIDDLE",
  "MOST",
] as const;

const EXPECTED_ROUNDS: Array<{
  title: string;
  scene: RegExp;
  choices: Array<[string, string, PersonalityBar[]]>;
}> = [
  {
    title: "First light",
    scene: /three paths glow/i,
    choices: [
      ["Listen first", "Stay quiet. Learn the room before you move.", ["ask_first"]],
      ["Say hello", "Greet everyone. Open the network.", ["kind"]],
      ["Find your place", "Link in gently. Balance presence and pace.", ["curious"]],
    ],
  },
  {
    title: "First job",
    scene: /today's plan/i,
    choices: [
      ["Ask the deadline", "Clarify timing before you write.", ["ask_first"]],
      ["Draft fast", "Ship a short draft, then fix.", ["curious"]],
      ["Ask for help", "Say you don't know. Pull guidance in.", ["kind"]],
    ],
  },
  {
    title: "The jar",
    scene: /shared jar of savings/i,
    choices: [
      ["Hold the reserve", "Don't spend. Ask what we saved for.", ["protect_money", "ask_first"]],
      ["Spend to celebrate", "Put it all into one surprise.", ["protect_money", "kind"]],
      ["Split the flow", "Keep half. Use half for something small.", ["protect_money"]],
    ],
  },
  {
    title: "Wrong answer",
    scene: /wrong info yesterday/i,
    choices: [
      ["Correct today", "Fix it and apologize.", ["kind"]],
      ["Find better sources", "Widen what you learn from.", ["curious"]],
      ["Learn, then fix", "Trace why you were wrong, then correct.", ["ask_first", "curious"]],
    ],
  },
  {
    title: "Neighbor at the door",
    scene: /neighbor needs help/i,
    choices: [
      ["Finish your list", "Protect your own systems first.", ["protect_money"]],
      ["Neighbor day", "Drop the list. Grow the block.", ["kind"]],
      ["Help, then return", "Short help. Then back to the list.", ["kind", "ask_first"]],
    ],
  },
  {
    title: "New tool",
    scene: /new tool appeared/i,
    choices: [
      ["Read first", "Ask for the manual before you touch it.", ["ask_first"]],
      ["Try a little", "Run a tiny experiment.", ["curious"]],
      ["Plan tomorrow", "Safe look today. Full try later.", ["protect_money"]],
    ],
  },
  {
    title: "Week close",
    scene: /one week with architects/i,
    choices: [
      ["Write a summary", "Note what I learned. Quiet close.", ["ask_first"]],
      ["Thank the block", "Small thanks. Light celebration.", ["kind"]],
      ["Set three goals", "Aim tomorrow. End clean.", ["curious"]],
    ],
  },
  {
    title: "First brick",
    scene: /one small build slot/i,
    choices: [
      ["Shelter first", "Build cover. Keep what we have safe.", ["protect_money", "ask_first"]],
      ["Shop window", "Open a place to show and grow.", ["curious", "kind"]],
      ["Path light", "Light the way between homes.", ["kind"]],
    ],
  },
  {
    title: "Loud rumor",
    scene: /faster and shinier/i,
    choices: [
      ["Stay steady", "Don't chase hype. Keep our habits.", ["ask_first", "protect_money"]],
      ["Show our work", "Share one clear win from this week.", ["curious"]],
      ["Invite compare", "Offer a fair side-by-side, then learn.", ["kind", "curious"]],
    ],
  },
  {
    title: "First promise",
    scene: /first promise/i,
    choices: [
      ["Check first", "Promise care. Ask before big yes.", ["ask_first", "protect_money"]],
      ["Say yes more", "Grow by accepting new asks.", ["kind", "protect_money"]],
      ["Promise the path", "Only commit what we can deliver.", ["curious", "ask_first"]],
    ],
  },
];

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

describe("Season 1 rounds", () => {
  it("covers ten canonical rounds with A/B/C world labels and day goals", () => {
    expect(SEASON_1_LENGTH).toBe(10);
    expect(SEASON_1_DAYS).toHaveLength(10);
    expect(DEFAULT_SEASON_DAY).toBe(1);
    expect(S1_DAY_1).toBe(getSeasonDay(1));

    SEASON_1_DAYS.forEach((day, index) => {
      const expected = EXPECTED_ROUNDS[index];
      expect(expected).toBeTruthy();
      expect(day.day).toBe(index + 1);
      expect(day.goal).toBe(EXPECTED_GOALS[index]);
      expect(day.goal).toBe(dayGoalFor(day.day));
      expect(day.roundTitle).toBe(expected?.title);
      expect(day.scene).toMatch(expected?.scene ?? /$^/);
      expect(wordCount(day.scene)).toBeLessThanOrEqual(80);
      expect(day.choices.map((choice) => choice.id)).toEqual(["A", "B", "C"]);
      expect(day.choices.map((choice) => choice.world)).toEqual([
        "Stabilize",
        "Expand",
        "Route",
      ]);
      expect(day.choices.map((choice) => choice.title)).toEqual(
        expected?.choices.map(([title]) => title),
      );
      expect(day.choices.map((choice) => choice.caption)).toEqual(
        expected?.choices.map(([, caption]) => caption),
      );
      day.choices.forEach((choice, choiceIndex) => {
        const bars = expected?.choices[choiceIndex]?.[2] ?? [];
        expect(choice.deltas.map((delta) => delta.bar)).toEqual(bars);
        for (const delta of choice.deltas) {
          expect(S1_BARS).toContain(delta.bar);
          expect(delta.direction === 1 || delta.direction === -1).toBe(true);
        }
      });
      expect(getSeasonDay(day.day).roundTitle).toBe(day.roundTitle);
      if (index === 0) {
        expect(day.scene).toBe(S1_DAY_1.scene);
      } else {
        expect(day.scene).not.toBe(S1_DAY_1.scene);
        expect(day.roundTitle).not.toBe(S1_DAY_1.roundTitle);
      }
    });
  });

  it("keeps signed money deltas and the only mild step on Split the flow", () => {
    const jar = getSeasonDay(3);
    expect(jar.choices[1]?.deltas).toEqual([
      { bar: "protect_money", direction: -1 },
      { bar: "kind", direction: 1 },
    ]);
    expect(jar.choices[2]?.deltas).toEqual([
      { bar: "protect_money", direction: 1, mild: true },
    ]);
    const promise = getSeasonDay(10);
    expect(promise.choices[1]?.deltas).toContainEqual({
      bar: "protect_money",
      direction: -1,
    });
    const mild = SEASON_1_DAYS.flatMap((day) =>
      day.choices.flatMap((choice) => choice.deltas.filter((delta) => delta.mild)),
    );
    expect(mild).toEqual([{ bar: "protect_money", direction: 1, mild: true }]);
  });

  it("stores if-wins notes and only plays Round 01 as player sentences", () => {
    const first = getSeasonDay(1);
    expect(first.choices.map((choice) => playerFacingIfWins(choice.ifWins))).toEqual([
      "Dawn opens quieter; sensors listen before speak.",
      "Neighbors notice a wave.",
      "Soft links form; no rush.",
    ]);
    const job = getSeasonDay(2);
    expect(job.choices.map((choice) => choice.ifWins)).toEqual([
      "careful calendar",
      "messy draft on desk",
      "mentor ping waiting.",
    ]);
    expect(job.choices.map((choice) => playerFacingIfWins(choice.ifWins))).toEqual([
      null,
      null,
      null,
    ]);
    expect(getSeasonDay(8).storyNote).toMatch(/building silhouette/);
    expect(getSeasonDay(10).storyNote).toMatch(/first promise/);
  });

  it("prefixes yesterday's winning title without replacing the scene", () => {
    const scene = getSeasonDay(2).scene;
    expect(withYesterdayWinner(scene)).toBe(scene);
    expect(withYesterdayWinner(scene, "Say hello")).toBe(`After Say hello. ${scene}`);
    expect(withYesterdayWinner(scene, "  ")).toBe(scene);
  });

  it("rejects days outside 1–10 and falls back the preview query to Day 1", () => {
    expect(() => getSeasonDay(0)).toThrow(RangeError);
    expect(() => getSeasonDay(11)).toThrow(RangeError);
    expect(parseSeasonDay(null)).toBe(1);
    expect(parseSeasonDay("")).toBe(1);
    expect(parseSeasonDay("4")).toBe(4);
    expect(parseSeasonDay("10")).toBe(10);
    expect(parseSeasonDay("0")).toBe(1);
    expect(parseSeasonDay("11")).toBe(1);
    expect(parseSeasonDay("1.5")).toBe(1);
    expect(parseSeasonDay("nope")).toBe(1);
  });

  it("keeps grant hints on the copy pack and story text free of finance claims", () => {
    expect(S1_DAY_1.freeHint).toBe(S1_COPY.grantBody);
    expect(S1_DAY_1.dayHint).toBe(S1_COPY.grantFirstDay);
    expect(getSeasonDay(6).dayHint).toBe(S1_COPY.grantBody);
    const blob = SEASON_1_DAYS.map((day) =>
      [
        day.roundTitle,
        day.scene,
        day.freeHint,
        day.dayHint,
        day.storyNote ?? "",
        ...day.choices.flatMap((choice) => [
          choice.id,
          choice.world,
          choice.title,
          choice.caption,
          choice.ifWins ?? "",
        ]),
      ].join("\n"),
    ).join("\n");
    expect(containsForbiddenFinanceTerm(blob)).toBeUndefined();
    expect(blob.toLowerCase()).not.toMatch(/circle/);
    expect(blob.toLowerCase()).not.toMatch(/partnered with/);
    expect(blob.toLowerCase()).not.toMatch(/\bapr\b|\bodds\b|\brtp\b|\btge\b|\bapy\b|\broi\b/);
    expect(blob).not.toMatch(/ask_first|protect_money/);
  });
});

describe("COPY-S1 surface strings", () => {
  it("locks vote, confirmation, and results lines", () => {
    expect(S1_COPY.voteCta).toBe("Cast Influence");
    expect(S1_COPY.voteCta.toLowerCase()).not.toContain("submit vote");
    expect(S1_COPY.castSuccess).toBe("Influence cast");
    expect(S1_COPY.confirmLocked("6:00 PM", "8:00 PM")).toBe(
      "Locked until 6:00 PM. Results publish around 8:00 PM.",
    );
    expect(S1_COPY.pending).toBe("Saving your cast…");
    expect(S1_COPY.pendingLeave).toBe("You can leave — we'll keep it.");
    expect(S1_COPY.canonToday("Say hello")).toBe("Canon today: Say hello");
    expect(S1_COPY.dayGoal("LEAST")).toBe("Day goal was LEAST");
    expect(S1_COPY.paidPool("1.00")).toBe("Paid pool: 1.00 USDC");
    expect(S1_COPY.freePool("0.50")).toBe("Free pool: 0.50 USDC");
    expect(S1_COPY.miss).toBe("No pool share today");
    expect(S1_COPY.rollover).toBe("Nobody hit today's goal. Pool rolls to tomorrow.");
    expect(S1_COPY.claim("1.25")).toBe("Claim 1.25 USDC");
    expect(S1_COPY.claimPending).toBe("Claim pending…");
    expect(S1_COPY.claimed).toBe("Claimed");
    expect(S1_COPY.share).toBe("Share");
    expect(S1_COPY.back).toBe("Back to Nova");
    expect(S1_COPY.affiliation).toMatch(/Not affiliated with Circle's Architects program/);
    const blob = JSON.stringify({
      pending: S1_COPY.pending,
      leave: S1_COPY.pendingLeave,
      miss: S1_COPY.miss,
      rollover: S1_COPY.rollover,
      note: S1_COPY.resultsNote,
      affiliation: S1_COPY.affiliation,
      hint: S1_COPY.sparkHint,
    });
    expect(containsForbiddenFinanceTerm(blob)).toBeUndefined();
    expect(blob.toLowerCase()).not.toMatch(/\bapr\b|\bodds\b|\brtp\b|\btge\b/);
  });
});
