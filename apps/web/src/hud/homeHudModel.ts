import type { ChoiceId } from "@nova/assets";
import { EFFECTIVE_EXTRA_CAP } from "@nova/shared";
import { BUY_COPY } from "../buy/buyCopy";
import { canCast, formatLocalTime, type DayState } from "../day/dayStore";

export type HudChoice = {
  id: ChoiceId;
  label: string;
  selected: boolean;
};

/** Top chrome shared by Home and Vote. */
export type HudChrome = {
  day: number;
  dayLabel: string;
  goal: DayState["goal"];
  freeInfluence: number;
  extraInfluence: number;
  freeHint: string;
};

/** Screen 05. Read-only story + picks; voting happens on Vote. */
export type HomeModel = HudChrome & {
  chapterLabel: string;
  title: string;
  scene: string;
  choices: HudChoice[];
  rankTitle: string;
  rankXp: { current: number; next: number };
  locked: boolean;
  closesLabel: string | null;
  ctaLabel: string;
};

/** Screen 06. Pick + two independent steppers. */
export type VoteModel = HudChrome & {
  status: DayState["status"];
  locked: boolean;
  choices: HudChoice[];
  spendAmount: number;
  extraSpendAmount: number;
  freeMeta: string;
  extraMeta: string;
  canDecreaseFree: boolean;
  canIncreaseFree: boolean;
  canDecreaseExtra: boolean;
  canIncreaseExtra: boolean;
  castEnabled: boolean;
  castLabel: string;
  lanes: string;
  buyEntry: string | null;
  buyEntryToBuy: boolean;
};

export const HUD_COPY = {
  rankTitle: "Architect · Apprentice",
  rankXp: { current: 1250, next: 2000 },
  chooseCta: (closes: string | null) =>
    closes ? `Choose and vote · closes ${closes}` : "Choose and vote",
  votingClosedCta: "Voting closed · see results",
  loadingCta: "Reading today from Arc…",
  castingCta: "Confirm in your wallet…",
  viewVoteCta: "View your vote",
  voteTitle: "Your choice",
  voteSub: "Choose the path for Nova today.",
  backLabel: "Cast Influence",
  castOn: (id: ChoiceId) => `Cast Influence on ${id}`,
  pickFirst: "Pick A, B or C",
  lockedCta: "Vote locked · view",
  lanes:
    "Free and Extra are counted in separate lanes. Extra doesn't make your pick more likely to win.",
  left: (left: number, of: number) => `${left} left of ${of}`,
} as const;

export function padDay(day: number): string {
  return String(day).padStart(2, "0");
}

export function voteBuyEntry(state: DayState): {
  buyEntry: string | null;
  buyEntryToBuy: boolean;
} {
  if (state.freeInfluence === 0 && state.extraInfluence === 0) {
    return { buyEntry: BUY_COPY.comeBack, buyEntryToBuy: true };
  }
  if (state.extraInfluence === 0) {
    return { buyEntry: BUY_COPY.needMore, buyEntryToBuy: true };
  }
  if (state.extraInfluence >= EFFECTIVE_EXTRA_CAP) {
    return { buyEntry: BUY_COPY.capHint, buyEntryToBuy: false };
  }
  return { buyEntry: null, buyEntryToBuy: false };
}

function chrome(state: DayState): HudChrome {
  return {
    day: state.day,
    dayLabel: `DAY ${padDay(state.day)}`,
    goal: state.goal,
    freeInfluence: state.freeInfluence,
    extraInfluence: state.extraInfluence,
    freeHint: state.freeHint,
  };
}

function choices(state: DayState): HudChoice[] {
  return state.choices.map((choice) => ({
    id: choice.id,
    label: choice.title,
    selected: state.selected === choice.id,
  }));
}

export function buildHomeModel(state: DayState): HomeModel {
  const locked = state.status === "cast";
  const close = state.schedule.voteCloseAt;
  const closesLabel = close === null ? null : formatLocalTime(close);
  return {
    ...chrome(state),
    chapterLabel: `CHAPTER ${padDay(state.day)}`,
    title: state.roundTitle,
    scene: state.scene,
    choices: choices(state),
    rankTitle: HUD_COPY.rankTitle,
    rankXp: HUD_COPY.rankXp,
    locked,
    closesLabel,
    ctaLabel: locked
      ? HUD_COPY.viewVoteCta
      : state.votingOpen
        ? HUD_COPY.chooseCta(closesLabel)
        : HUD_COPY.votingClosedCta,
  };
}

export function buildVoteModel(state: DayState): VoteModel {
  const open = state.status === "open";
  const lastCast = open ? undefined : state.casts.at(-1);
  // After a cast the steppers show what went on the pick, read-only.
  const free = lastCast ? lastCast.free : state.spendAmount;
  const extra = lastCast ? lastCast.extra : state.extraSpendAmount;
  const freePool = lastCast ? lastCast.free + state.freeInfluence : state.freeInfluence;
  const extraPool = lastCast ? lastCast.extra + state.extraInfluence : state.extraInfluence;
  const { buyEntry, buyEntryToBuy } = voteBuyEntry(state);
  const selected = state.selected;

  return {
    ...chrome(state),
    status: state.status,
    locked: !open,
    choices: choices(state),
    spendAmount: free,
    extraSpendAmount: extra,
    freeMeta: HUD_COPY.left(Math.max(0, freePool - free), freePool),
    extraMeta: HUD_COPY.left(Math.max(0, extraPool - extra), extraPool),
    canDecreaseFree: open && state.spendAmount > 0,
    canIncreaseFree: open && state.spendAmount < state.freeInfluence,
    canDecreaseExtra: open && state.extraSpendAmount > 0,
    canIncreaseExtra: open && state.extraSpendAmount < state.extraInfluence,
    castEnabled: canCast(state),
    castLabel: !open
      ? HUD_COPY.lockedCta
      : selected
        ? HUD_COPY.castOn(selected)
        : HUD_COPY.pickFirst,
    lanes: HUD_COPY.lanes,
    buyEntry: open ? buyEntry : null,
    buyEntryToBuy,
  };
}
