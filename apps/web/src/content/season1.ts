import type { ChoiceId } from "@nova/assets";
import { dayGoalFor, type DayGoal } from "@nova/shared";

export type WorldFamily = "Stabilize" | "Expand" | "Route";

export type DayChoiceCopy = {
  id: ChoiceId;
  world: WorldFamily;
  title: string;
  caption: string;
};

export type SeasonDayCopy = {
  day: number;
  roundTitle: string;
  goal: DayGoal;
  scene: string;
  freeHint: string;
  dayHint: string;
  choices: [DayChoiceCopy, DayChoiceCopy, DayChoiceCopy];
};

const WORLD_BY_SLOT: Record<ChoiceId, WorldFamily> = {
  A: "Stabilize",
  B: "Expand",
  C: "Route",
};

/** HIKAYE Round 01 + COPY-S1 B2/B3. EN-first UI. */
export const S1_DAY_1: SeasonDayCopy = {
  day: 1,
  roundTitle: "First light",
  goal: dayGoalFor(1),
  scene:
    "Hi. I'm Nova. I just opened on the Archipelago. Three paths glow. Which one do we take first?",
  freeHint: "Yours for today. Unused Free burns when the day ends.",
  dayHint: "Use it on today's three choices. You can skip Extra.",
  choices: [
    {
      id: "A",
      world: WORLD_BY_SLOT.A,
      title: "Listen first",
      caption: "Stay quiet. Learn the room before you move.",
    },
    {
      id: "B",
      world: WORLD_BY_SLOT.B,
      title: "Say hello",
      caption: "Greet everyone. Open the network.",
    },
    {
      id: "C",
      world: WORLD_BY_SLOT.C,
      title: "Find your place",
      caption: "Link in gently. Balance presence and pace.",
    },
  ],
};

export const DEFAULT_SEASON_DAY = S1_DAY_1.day;

export function getSeasonDay(day: number = DEFAULT_SEASON_DAY): SeasonDayCopy {
  if (day === S1_DAY_1.day) {
    return S1_DAY_1;
  }
  return { ...S1_DAY_1, day, goal: dayGoalFor(day) };
}
