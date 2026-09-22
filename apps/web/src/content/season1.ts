import type { ChoiceId } from "@nova/assets";
import { dayGoalFor, type DayGoal } from "@nova/shared";
import { S1_COPY } from "./s1Copy";

/** S1 Birth bars. Technical ids stay off the player HUD. */
export const S1_BARS = ["ask_first", "kind", "curious", "protect_money"] as const;

export type PersonalityBar = (typeof S1_BARS)[number];

export type BarDelta = {
  bar: PersonalityBar;
  direction: 1 | -1;
  /** Softer step. The pack marks this only on Round 03 Route. */
  mild?: boolean;
};

export type WorldFamily = "Stabilize" | "Expand" | "Route";

export type DayChoiceCopy = {
  id: ChoiceId;
  world: WorldFamily;
  title: string;
  caption: string;
  deltas: readonly BarDelta[];
  /** Next-dawn note from HIKAYE. Player sentences also pass `playerFacingIfWins`. */
  ifWins?: string;
};

export type SeasonDayCopy = {
  day: number;
  roundTitle: string;
  goal: DayGoal;
  scene: string;
  freeHint: string;
  dayHint: string;
  choices: readonly [DayChoiceCopy, DayChoiceCopy, DayChoiceCopy];
  /** Author note (neighborhood mark, first-promise chip). Not a screen CTA. */
  storyNote?: string;
};

export const SEASON_1_LENGTH = 10;
export const DEFAULT_SEASON_DAY = 1;

const WORLD_BY_SLOT = {
  A: "Stabilize",
  B: "Expand",
  C: "Route",
} as const satisfies Record<ChoiceId, WorldFamily>;

function rise(bar: PersonalityBar, mild = false): BarDelta {
  return mild ? { bar, direction: 1, mild: true } : { bar, direction: 1 };
}

function fall(bar: PersonalityBar): BarDelta {
  return { bar, direction: -1 };
}

function choice(
  id: ChoiceId,
  title: string,
  caption: string,
  deltas: readonly BarDelta[],
  ifWins?: string,
): DayChoiceCopy {
  return {
    id,
    world: WORLD_BY_SLOT[id],
    title,
    caption,
    deltas,
    ...(ifWins ? { ifWins } : {}),
  };
}

function round(
  day: number,
  roundTitle: string,
  scene: string,
  choices: readonly [DayChoiceCopy, DayChoiceCopy, DayChoiceCopy],
  storyNote?: string,
): SeasonDayCopy {
  return {
    day,
    roundTitle,
    goal: dayGoalFor(day),
    scene,
    freeHint: S1_COPY.grantBody,
    dayHint: day === 1 ? S1_COPY.grantFirstDay : S1_COPY.grantBody,
    choices,
    ...(storyNote ? { storyNote } : {}),
  };
}

/**
 * Canonical S1 Birth rounds 01–10 (HIKAYE-S1-ROUNDS).
 * A/B/C stay Stabilize / Expand / Route. Goals come from `dayGoalFor`.
 */
export const SEASON_1_DAYS: readonly SeasonDayCopy[] = [
  round(
    1,
    "First light",
    "Hi. I'm Nova. I just opened on the Archipelago. Three paths glow. Which one do we take first?",
    [
      choice(
        "A",
        "Listen first",
        "Stay quiet. Learn the room before you move.",
        [rise("ask_first")],
        "Dawn opens quieter; sensors listen before speak.",
      ),
      choice(
        "B",
        "Say hello",
        "Greet everyone. Open the network.",
        [rise("kind")],
        "Neighbors notice a wave.",
      ),
      choice(
        "C",
        "Find your place",
        "Link in gently. Balance presence and pace.",
        [rise("curious")],
        "Soft links form; no rush.",
      ),
    ],
  ),
  round(
    2,
    "First job",
    "Someone asked for today's plan. I don't have one. How do I start?",
    [
      choice(
        "A",
        "Ask the deadline",
        "Clarify timing before you write.",
        [rise("ask_first")],
        "careful calendar",
      ),
      choice(
        "B",
        "Draft fast",
        "Ship a short draft, then fix.",
        [rise("curious")],
        "messy draft on desk",
      ),
      choice(
        "C",
        "Ask for help",
        "Say you don't know. Pull guidance in.",
        [rise("kind")],
        "mentor ping waiting.",
      ),
    ],
  ),
  round(
    3,
    "The jar",
    "There's a shared jar of savings. Someone says spend it all for fun. What do we do?",
    [
      choice(
        "A",
        "Hold the reserve",
        "Don't spend. Ask what we saved for.",
        [rise("protect_money"), rise("ask_first")],
      ),
      choice(
        "B",
        "Spend to celebrate",
        "Put it all into one surprise.",
        [fall("protect_money"), rise("kind")],
      ),
      choice(
        "C",
        "Split the flow",
        "Keep half. Use half for something small.",
        [rise("protect_money", true)],
      ),
    ],
  ),
  round(
    4,
    "Wrong answer",
    "I gave wrong info yesterday. I see it now. What next?",
    [
      choice("A", "Correct today", "Fix it and apologize.", [rise("kind")]),
      choice(
        "B",
        "Find better sources",
        "Widen what you learn from.",
        [rise("curious")],
      ),
      choice(
        "C",
        "Learn, then fix",
        "Trace why you were wrong, then correct.",
        [rise("ask_first"), rise("curious")],
      ),
    ],
  ),
  round(
    5,
    "Neighbor at the door",
    "A neighbor needs help. My list is full. Choose.",
    [
      choice(
        "A",
        "Finish your list",
        "Protect your own systems first.",
        [rise("protect_money")],
      ),
      choice("B", "Neighbor day", "Drop the list. Grow the block.", [rise("kind")]),
      choice(
        "C",
        "Help, then return",
        "Short help. Then back to the list.",
        [rise("kind"), rise("ask_first")],
      ),
    ],
  ),
  round(
    6,
    "New tool",
    "A new tool appeared. No one explained it. What do I do?",
    [
      choice(
        "A",
        "Read first",
        "Ask for the manual before you touch it.",
        [rise("ask_first")],
      ),
      choice("B", "Try a little", "Run a tiny experiment.", [rise("curious")]),
      choice(
        "C",
        "Plan tomorrow",
        "Safe look today. Full try later.",
        [rise("protect_money")],
      ),
    ],
  ),
  round(
    7,
    "Week close",
    "One week with Architects. How do I close the day?",
    [
      choice(
        "A",
        "Write a summary",
        "Note what I learned. Quiet close.",
        [rise("ask_first")],
      ),
      choice(
        "B",
        "Thank the block",
        "Small thanks. Light celebration.",
        [rise("kind")],
      ),
      choice("C", "Set three goals", "Aim tomorrow. End clean.", [rise("curious")]),
    ],
  ),
  round(
    8,
    "First brick",
    "The Archipelago offers one small build slot. A shelter? A shop window? A path light? I can place only one brick today.",
    [
      choice(
        "A",
        "Shelter first",
        "Build cover. Keep what we have safe.",
        [rise("protect_money"), rise("ask_first")],
      ),
      choice(
        "B",
        "Shop window",
        "Open a place to show and grow.",
        [rise("curious"), rise("kind")],
      ),
      choice("C", "Path light", "Light the way between homes.", [rise("kind")]),
    ],
    "Neighborhood map gains one building silhouette matching the winner.",
  ),
  round(
    9,
    "Loud rumor",
    'A rumor says another agent nearby is "faster and shinier." People look at me. How do we answer without shouting?',
    [
      choice(
        "A",
        "Stay steady",
        "Don't chase hype. Keep our habits.",
        [rise("ask_first"), rise("protect_money")],
      ),
      choice(
        "B",
        "Show our work",
        "Share one clear win from this week.",
        [rise("curious")],
      ),
      choice(
        "C",
        "Invite compare",
        "Offer a fair side-by-side, then learn.",
        [rise("kind"), rise("curious")],
      ),
    ],
  ),
  round(
    10,
    "First promise",
    'Someone asks me for a promise: "Always say yes." Another says: "Always check first." A third: "Promise only what you can route." What do we lock as my first promise?',
    [
      choice(
        "A",
        "Check first",
        "Promise care. Ask before big yes.",
        [rise("ask_first"), rise("protect_money")],
      ),
      choice(
        "B",
        "Say yes more",
        "Grow by accepting new asks.",
        [rise("kind"), fall("protect_money")],
      ),
      choice(
        "C",
        "Promise the path",
        "Only commit what we can deliver.",
        [rise("curious"), rise("ask_first")],
      ),
    ],
    'Round 10 winner becomes Nova\'s "first promise" chip on Profile until S1 final.',
  ),
];

export const S1_DAY_1 = SEASON_1_DAYS[0] as SeasonDayCopy;

const DAYS_BY_NUMBER = new Map(SEASON_1_DAYS.map((day) => [day.day, day]));

export function getSeasonDay(day: number = DEFAULT_SEASON_DAY): SeasonDayCopy {
  const found = DAYS_BY_NUMBER.get(day);
  if (!found) {
    throw new RangeError(
      `Season 1 includes days 1–${SEASON_1_LENGTH} (received ${day})`,
    );
  }
  return found;
}

/** Entry query for a round preview. Invalid values stay on Day 1. Not a day loop. */
export function parseSeasonDay(value: string | null | undefined): number {
  if (value == null || value.trim() === "") {
    return DEFAULT_SEASON_DAY;
  }
  const day = Number(value);
  if (!Number.isInteger(day) || day < 1 || day > SEASON_1_LENGTH) {
    return DEFAULT_SEASON_DAY;
  }
  return day;
}

/**
 * Full sentences from the pack (Round 01). Author shorthand stays in data only.
 */
export function playerFacingIfWins(text: string | undefined): string | null {
  if (!text) {
    return null;
  }
  const trimmed = text.trim();
  if (!/^[A-Z]/.test(trimmed) || !trimmed.endsWith(".")) {
    return null;
  }
  return trimmed;
}

/**
 * Continuity rule: one short clause naming yesterday's winning title.
 * The day loop (P1-07) applies this. This slice does not advance days.
 */
export function withYesterdayWinner(scene: string, winnerTitle?: string): string {
  const title = winnerTitle?.trim();
  if (!title) {
    return scene;
  }
  return `After ${title}. ${scene}`;
}

export function cloneSeasonChoices(
  choices: SeasonDayCopy["choices"],
): SeasonDayCopy["choices"] {
  const [a, b, c] = choices;
  return [
    { ...a, deltas: [...a.deltas] },
    { ...b, deltas: [...b.deltas] },
    { ...c, deltas: [...c.deltas] },
  ];
}
