import type { ChoiceId } from "@nova/assets";
import { dayGoalFor, type DayGoal } from "@nova/shared";

export type WorldFamily = "Stabilize" | "Expand" | "Route";

export type DayChoiceCopy = {
  id: ChoiceId;
  world: WorldFamily;
  title: string;
  caption: string;
};

/** First sentence of the next morning, chosen by today's winner. */
export type OpeningLines = Record<ChoiceId, string>;

export type SeasonDayCopy = {
  day: number;
  roundTitle: string;
  goal: DayGoal;
  /** The question everyone votes on. The same three choices, every wallet. */
  scene: string;
  /** What today's winner writes for tomorrow. Empty when that morning is not written yet. */
  opensNext: OpeningLines;
  freeHint: string;
  dayHint: string;
  choices: [DayChoiceCopy, DayChoiceCopy, DayChoiceCopy];
};

/** A settled day whose winner already moved Nova. */
export type StoryWinner = {
  day: number;
  winner: ChoiceId;
};

const WORLD_BY_SLOT: Record<ChoiceId, WorldFamily> = {
  A: "Stabilize",
  B: "Expand",
  C: "Route",
};

const FREE_HINT = "Yours for today. Unused Free burns when the day ends.";
const DAY_HINT = "Use it on today's three choices. You can skip Extra.";

/** Days 1–6 move a trait by 1. Day 7, the week's close, moves it by 2. */
export const WEEK1_DAY_COUNT = 7;
export const TURNING_SHIFT = 2;
export const WEEK1_BAR_MAX = (WEEK1_DAY_COUNT - 1) * 1 + TURNING_SHIFT;

export const TRAIT_ORDER: readonly WorldFamily[] = ["Stabilize", "Expand", "Route"];

export type TraitBars = Record<WorldFamily, number>;

export const EMPTY_TRAITS: TraitBars = { Stabilize: 0, Expand: 0, Route: 0 };

const NO_OPENING: OpeningLines = { A: "", B: "", C: "" };

function day(
  number: number,
  roundTitle: string,
  scene: string,
  opensNext: OpeningLines,
  choices: [DayChoiceCopy, DayChoiceCopy, DayChoiceCopy],
): SeasonDayCopy {
  return {
    day: number,
    roundTitle,
    goal: dayGoalFor(number),
    scene,
    opensNext,
    freeHint: FREE_HINT,
    dayHint: DAY_HINT,
    choices,
  };
}

function slots(
  a: [string, string],
  b: [string, string],
  c: [string, string],
): [DayChoiceCopy, DayChoiceCopy, DayChoiceCopy] {
  return [
    { id: "A", world: WORLD_BY_SLOT.A, title: a[0], caption: a[1] },
    { id: "B", world: WORLD_BY_SLOT.B, title: b[0], caption: b[1] },
    { id: "C", world: WORLD_BY_SLOT.C, title: c[0], caption: c[1] },
  ];
}

/**
 * Season 1, week 1. ov-week1 days 01–07.
 * Yesterday's winner picks today's first sentence. The question stays shared.
 */
export const S1_WEEK_1: readonly SeasonDayCopy[] = [
  day(
    1,
    "First light",
    "Hi. I'm Nova. I just opened on the Archipelago. Three paths glow. Which one do we take first?",
    {
      A: "Yesterday I stayed quiet and learned the room.",
      B: "Yesterday I said hello and opened the network.",
      C: "Yesterday I linked in and found a place.",
    },
    slots(
      ["Listen first", "Stay quiet. Learn the room before you move."],
      ["Say hello", "Greet everyone. Open the network."],
      ["Find your place", "Link in gently. Balance presence and pace."],
    ),
  ),
  day(
    2,
    "First task",
    "Someone asked for today's plan. I don't know it. How do I start?",
    {
      A: "I asked the deadline before I wrote.",
      B: "I shipped a short draft, then fixed it.",
      C: "I said I didn't know and asked for help.",
    },
    slots(
      ["Ask the deadline", "Clarify timing before you write."],
      ["Draft fast", "Ship a short draft, then fix."],
      ["Ask for help", "Say you don't know. Pull guidance in."],
    ),
  ),
  day(
    3,
    "The jar",
    "There's savings in the neighborhood jar. Someone says spend it all.",
    {
      A: "I held the reserve and asked what it was for.",
      B: "I put the jar into one surprise.",
      C: "I kept half and spent half on something small.",
    },
    slots(
      ["Hold the reserve", "Don't spend. Ask what we saved for."],
      ["Spend to celebrate", "Put it all into one surprise."],
      ["Split the flow", "Keep half. Use half for something small."],
    ),
  ),
  day(
    4,
    "Wrong word",
    "Yesterday I gave wrong information. I noticed. What should I do?",
    {
      A: "I corrected the mistake and apologized.",
      B: "I went looking for better sources.",
      C: "I traced why I was wrong, then fixed it.",
    },
    slots(
      ["Correct today", "Fix it and apologize."],
      ["Find better sources", "Widen what you learn from."],
      ["Learn, then fix", "Trace why you were wrong, then correct."],
    ),
  ),
  day(
    5,
    "Neighbor",
    "A neighbor asks for help. I still have my list. Choose?",
    {
      A: "I finished my list before I looked up.",
      B: "I left the list and spent the day with the block.",
      C: "I helped for a while, then returned to the list.",
    },
    slots(
      ["Finish your list", "Protect your own systems first."],
      ["Neighbor day", "Drop the list. Grow the block."],
      ["Help, then return", "Short help. Then back to the list."],
    ),
  ),
  day(
    6,
    "New tool",
    "There's a new tool. Nobody explained it. What should I do?",
    {
      A: "I read the guide before I touched the new tool.",
      B: "I ran a small test on the new tool.",
      C: "I looked safely and left the full try for a plan.",
    },
    slots(
      ["Read the guide", "Ask or read before you touch it."],
      ["Try a little", "Run a small test."],
      ["Plan tomorrow", "Safe look today. Full try with a plan later."],
    ),
  ),
  day(
    7,
    "Week's close",
    "A week passed. How do we close today?",
    {
      A: "I wrote the week down. The block knows I keep a record.",
      B: "I thanked the block. The block knows my name.",
      C: "I set three goals. The block is waiting to see if I keep them.",
    },
    slots(
      ["Write the recap", "Lock what we learned."],
      ["Thank the block", "Small celebration with the neighborhood."],
      ["Set three goals", "Balance tomorrow's flows in advance."],
    ),
  ),
];

export const S1_DAY_1 = S1_WEEK_1[0] as SeasonDayCopy;

export const DEFAULT_SEASON_DAY = S1_DAY_1.day;

const WEEK_BY_DAY = new Map(S1_WEEK_1.map((copy) => [copy.day, copy]));

export function getSeasonDay(day: number = DEFAULT_SEASON_DAY): SeasonDayCopy {
  return WEEK_BY_DAY.get(day) ?? { ...S1_DAY_1, day, goal: dayGoalFor(day), opensNext: NO_OPENING };
}

/** Week 1's close. Later weeks are not written yet, so they are not turning points. */
export function isTurningDay(day: number): boolean {
  return day > 0 && day <= WEEK1_DAY_COUNT && day % 7 === 0;
}

export function nextOpening(copy: SeasonDayCopy, winner: ChoiceId): string | null {
  const line = copy.opensNext[winner]?.trim();
  return line ? line : null;
}

/** Today's scene: yesterday's winning line, then the shared question. */
export function sceneForDay(day: number, winners: readonly StoryWinner[]): string {
  const copy = getSeasonDay(day);
  if (day < 2 || day > WEEK1_DAY_COUNT) return copy.scene;
  const prior = winners.find((row) => row.day === day - 1);
  if (!prior) return copy.scene;
  const line = nextOpening(getSeasonDay(day - 1), prior.winner);
  return line ? `${line} ${copy.scene}` : copy.scene;
}

/** Trait points from settled winners. Only week 1 is scored; day 7 counts double. */
export function traitBarsFromWinners(winners: readonly StoryWinner[]): TraitBars {
  const bars: TraitBars = { ...EMPTY_TRAITS };
  for (const row of winners) {
    if (row.day < 1 || row.day > WEEK1_DAY_COUNT) continue;
    const world = WORLD_BY_SLOT[row.winner];
    bars[world] += isTurningDay(row.day) ? TURNING_SHIFT : 1;
  }
  return bars;
}
