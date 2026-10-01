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

export type ClaimStatus = "idle" | "pending" | "claimed";

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
  packsBought: PackId[];
  lastBuy: LastBuy | null;
  selected: ChoiceId | null;
  spendAmount: number;
  /** Extra Influence the stepper will place on the pick. Separate from Free. */
  extraSpendAmount: number;
  casts: LocalCast[];
  status: CastStatus;
  schedule: VoteSchedule;
  claimStatus: ClaimStatus;
  claim: ClaimSnapshot | null;
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
    packsBought: [],
    lastBuy: null,
    selected: null,
    spendAmount: freeInfluence,
    extraSpendAmount: 0,
    casts: [],
    status: "open",
    schedule: stubVoteSchedule(now),
    claimStatus: "idle",
    claim: null,
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
    state.selected !== null &&
    placing &&
    state.spendAmount <= state.freeInfluence &&
    state.extraSpendAmount <= state.extraInfluence
  );
}

function placeExtraOnLatestCast(state: DayState, extra: number): DayState {
  if (state.status !== "cast" || extra === 0 || state.casts.length === 0) {
    return state;
  }
  const index = state.casts.length - 1;
  const current = state.casts[index];
  if (!current) {
    return state;
  }
  const casts = state.casts.map((cast, i) =>
    i === index ? { ...cast, extra: cast.extra + extra } : cast,
  );
  return { ...state, casts };
}

/**
 * Spends Free Influence onto the selected tile via `@nova/shared` helpers.
 * Extra already bought today is placed on the same option (separate lane).
 */
export function castSelected(state: DayState): DayState {
  if (!canCast(state) || !state.selected) {
    return state;
  }
  const { spent, remaining } = spendInfluence(
    state.freeInfluence,
    state.spendAmount,
  );
  const extraPlaced = Math.min(state.extraSpendAmount, state.extraInfluence);
  return {
    ...state,
    freeInfluence: remaining,
    spendAmount: remaining,
    extraSpendAmount: extraPlaced,
    casts: [
      ...state.casts,
      {
        walletId: LOCAL_PLAYER_ID,
        optionId: state.selected,
        extra: extraPlaced,
        free: spent,
      },
    ],
    status: "cast",
  };
}

/**
 * Mock Extra purchase: `attemptBuy` from `@nova/shared`, no chain / no wallet.
 * Free Influence is never mixed into Extra. After a cast, Extra sits on that pick.
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
  const next: DayState = {
    ...state,
    extraInfluence: state.extraInfluence + attempt.extraInfluence,
    extraSpendAmount:
      state.status === "open"
        ? state.extraInfluence + attempt.extraInfluence
        : state.extraSpendAmount,
    spentTodayMicro: attempt.spentAfter,
    packsBought: [...state.packsBought, packId],
    lastBuy: {
      ok: true,
      packId,
      extraInfluence: attempt.extraInfluence,
    },
  };
  return placeExtraOnLatestCast(next, attempt.extraInfluence);
}

/** Mock claim. Primary CTA lives on Results; Profile is history-only. */
export function claimPayout(state: DayState, snapshot: ClaimSnapshot): DayState {
  if (state.claimStatus === "claimed") {
    return state;
  }
  if (snapshot.total <= 0n) {
    return state;
  }
  return {
    ...state,
    claimStatus: "claimed",
    claim: snapshot,
  };
}