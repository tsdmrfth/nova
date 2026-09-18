import type { ChoiceId } from "@nova/assets";
import {
  attemptBuy,
  grantDailyFree,
  spendInfluence,
  type DayGoal,
  type MicroUsdc,
  type PackId,
} from "@nova/shared";
import { getSeasonDay, type DayChoiceCopy } from "../content/season1";

export const LOCAL_PLAYER_ID = "local";

export type CastStatus = "open" | "cast";

export type LocalCast = {
  walletId: typeof LOCAL_PLAYER_ID;
  optionId: ChoiceId;
  extra: number;
  free: number;
};

export type VoteSchedule = {
  voteCloseAt: number;
  publishAt: number;
};

export type LastBuy = {
  ok: boolean;
  packId: PackId;
  extraInfluence: number;
  code?: "DAILY_BUY_CAP_EXCEEDED";
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
  casts: LocalCast[];
  status: CastStatus;
  schedule: VoteSchedule;
};

const MS_HOUR = 60 * 60 * 1000;

/** Device-local 18:00 close, results two hours later. Stub schedule only. */
export function stubVoteSchedule(now: Date = new Date()): VoteSchedule {
  const close = new Date(now);
  close.setHours(18, 0, 0, 0);
  if (close.getTime() <= now.getTime()) {
    close.setDate(close.getDate() + 1);
  }
  return {
    voteCloseAt: close.getTime(),
    publishAt: close.getTime() + 2 * MS_HOUR,
  };
}

export function formatLocalStamp(at: number): string {
  return new Date(at).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function createDayState(
  day = 1,
  now: Date = new Date(),
): DayState {
  const copy = getSeasonDay(day);
  const freeInfluence = grantDailyFree();
  return {
    day: copy.day,
    goal: copy.goal,
    roundTitle: copy.roundTitle,
    scene: copy.scene,
    freeHint: copy.freeHint,
    dayHint: copy.dayHint,
    choices: copy.choices,
    freeInfluence,
    extraInfluence: 0,
    spentTodayMicro: 0n,
    lastBuy: null,
    selected: null,
    spendAmount: freeInfluence,
    casts: [],
    status: "open",
    schedule: stubVoteSchedule(now),
  };
}

export function clampSpend(balance: number, amount: number): number {
  if (!Number.isInteger(amount) || amount < 0) {
    return 0;
  }
  return Math.min(amount, Math.max(0, balance));
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

export function canCast(state: DayState): boolean {
  return (
    state.status === "open" &&
    state.selected !== null &&
    state.spendAmount > 0 &&
    state.spendAmount <= state.freeInfluence
  );
}

/**
 * Spends Free Influence onto the selected tile via `@nova/shared` helpers.
 * Extra is credited only through `buyPack` and stays on its own balance.
 */
export function castSelected(state: DayState): DayState {
  if (!canCast(state) || !state.selected) {
    return state;
  }
  const { spent, remaining } = spendInfluence(
    state.freeInfluence,
    state.spendAmount,
  );
  return {
    ...state,
    freeInfluence: remaining,
    spendAmount: remaining,
    casts: [
      ...state.casts,
      {
        walletId: LOCAL_PLAYER_ID,
        optionId: state.selected,
        extra: 0,
        free: spent,
      },
    ],
    status: "cast",
  };
}

/**
 * Mock Extra purchase: `attemptBuy` from `@nova/shared`, no chain / no wallet.
 * Free Influence is never mixed into Extra.
 */
export function buyPack(state: DayState, packId: PackId): DayState {
  const attempt = attemptBuy(packId, state.spentTodayMicro);
  if (!attempt.ok) {
    return {
      ...state,
      lastBuy: {
        ok: false,
        packId,
        extraInfluence: 0,
        code: attempt.code,
      },
    };
  }
  return {
    ...state,
    extraInfluence: state.extraInfluence + attempt.extraInfluence,
    spentTodayMicro: attempt.spentAfter,
    lastBuy: {
      ok: true,
      packId,
      extraInfluence: attempt.extraInfluence,
    },
  };
}
