import type { ChoiceId } from "@nova/assets";
import { FREE_DAILY_GRANT, type DayGoal, type MicroUsdc, type PackId } from "@nova/shared";
import type { ChainDay } from "../chain/novaChain";
import { getSeasonDay, type DayChoiceCopy } from "../content/season1";

export type CastStatus = "open" | "cast";

export type ClaimStatus = "idle" | "pending" | "claimed" | "failed";

export type LocalCast = {
  walletId: string;
  optionId: ChoiceId;
  extra: number;
  free: number;
};

export type VoteSchedule = {
  /** Epoch ms from the pool, or null when the owner closes the day by settling. */
  voteCloseAt: number | null;
};

export type LastBuy = {
  ok: boolean;
  packId: PackId;
  extraInfluence: number;
};

export type ClaimSnapshot = {
  paid: MicroUsdc;
  free: MicroUsdc;
  total: MicroUsdc;
  spark: number;
  winningOptionId: string;
};

export type DayState = {
  day: number;
  goal: DayGoal;
  roundTitle: string;
  scene: string;
  freeHint: string;
  dayHint: string;
  choices: [DayChoiceCopy, DayChoiceCopy, DayChoiceCopy];
  freeInfluence: number;
  extraInfluence: number;
  spentTodayMicro: MicroUsdc;
  lastBuy: LastBuy | null;
  selected: ChoiceId | null;
  spendAmount: number;
  /** Extra Influence the stepper will place on the pick. Separate from Free. */
  extraSpendAmount: number;
  casts: LocalCast[];
  status: CastStatus;
  /** The pool's day is open and its close time (if any) has not passed. */
  votingOpen: boolean;
  /** The pool settled this day; results are readable. */
  settled: boolean;
  schedule: VoteSchedule;
  claim: ClaimSnapshot | null;
};

/** Choices the player is still making before the vote is onchain. */
export type DayUi = {
  selected: ChoiceId | null;
  spendAmount: number | null;
  extraSpendAmount: number | null;
  lastBuy: LastBuy | null;
};

export const EMPTY_DAY_UI: DayUi = {
  selected: null,
  spendAmount: null,
  extraSpendAmount: null,
  lastBuy: null,
};

export function formatLocalStamp(at: number): string {
  return new Date(at).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** Short clock time for chips and CTAs ("18:00"). */
export function formatLocalTime(at: number): string {
  return new Date(at).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

/** Content for a day with nothing onchain yet; voting stays shut until the pool is read. */
export function createDayState(day = 1): DayState {
  const copy = getSeasonDay(day);
  return {
    day: copy.day,
    goal: copy.goal,
    roundTitle: copy.roundTitle,
    scene: copy.scene,
    freeHint: copy.freeHint,
    dayHint: copy.dayHint,
    choices: copy.choices,
    freeInfluence: FREE_DAILY_GRANT,
    extraInfluence: 0,
    spentTodayMicro: 0n,
    lastBuy: null,
    selected: null,
    spendAmount: FREE_DAILY_GRANT,
    extraSpendAmount: 0,
    casts: [],
    status: "open",
    votingOpen: false,
    settled: false,
    schedule: { voteCloseAt: null },
    claim: null,
  };
}

export function clampSpend(balance: number, amount: number): number {
  if (!Number.isInteger(amount) || amount < 0) {
    return 0;
  }
  return Math.min(amount, Math.max(0, balance));
}

/**
 * The pool is the source of truth for balances and the vote. Before the vote,
 * the pick and both stepper amounts are local choices layered on top.
 */
export function dayStateFromChain(
  chain: ChainDay | null,
  ui: DayUi,
  account: string | null,
  now: number = Date.now(),
): DayState {
  const base = createDayState(chain?.dayId ?? 1);
  if (!chain) {
    return { ...base, selected: ui.selected, lastBuy: ui.lastBuy };
  }
  const entry = chain.entry;
  const votingOpen = chain.open && (chain.closesAt === null || now < chain.closesAt);
  const shared = {
    ...base,
    extraInfluence: entry.extraBought,
    spentTodayMicro: chain.spentMicro,
    lastBuy: ui.lastBuy,
    votingOpen,
    settled: chain.settled,
    schedule: { voteCloseAt: chain.closesAt },
  };

  if (entry.voted && entry.option) {
    const remaining = Math.max(0, FREE_DAILY_GRANT - entry.free);
    return {
      ...shared,
      freeInfluence: remaining,
      spendAmount: remaining,
      extraSpendAmount: entry.extraPlaced,
      selected: entry.option,
      status: "cast",
      casts: [{ walletId: account ?? "", optionId: entry.option, extra: entry.extraPlaced, free: entry.free }],
    };
  }

  return {
    ...shared,
    selected: ui.selected,
    spendAmount: clampSpend(FREE_DAILY_GRANT, ui.spendAmount ?? FREE_DAILY_GRANT),
    extraSpendAmount: clampSpend(entry.extraBought, ui.extraSpendAmount ?? entry.extraBought),
  };
}

export function selectChoice(state: DayState, id: ChoiceId): DayState {
  if (state.status !== "open") {
    return state;
  }
  return { ...state, selected: id };
}

export function setSpendAmount(state: DayState, amount: number): DayState {
  if (state.status !== "open") {
    return state;
  }
  return { ...state, spendAmount: clampSpend(state.freeInfluence, amount) };
}

export function setExtraSpendAmount(state: DayState, amount: number): DayState {
  if (state.status !== "open") {
    return state;
  }
  return {
    ...state,
    extraSpendAmount: clampSpend(state.extraInfluence, amount),
  };
}

export function canCast(state: DayState): boolean {
  const placing = state.spendAmount > 0 || state.extraSpendAmount > 0;
  return (
    state.status === "open" &&
    state.votingOpen &&
    state.selected !== null &&
    placing &&
    state.spendAmount <= state.freeInfluence &&
    state.extraSpendAmount <= state.extraInfluence
  );
}

export function uiFromState(state: DayState, lastBuy: LastBuy | null): DayUi {
  return {
    selected: state.selected,
    spendAmount: state.spendAmount,
    extraSpendAmount: state.extraSpendAmount,
    lastBuy,
  };
}
