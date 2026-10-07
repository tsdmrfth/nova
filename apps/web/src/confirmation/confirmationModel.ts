import type { ChoiceId } from "@nova/assets";
import { formatLocalTime, type DayState } from "../day/dayStore";
import { padDay } from "../hud/homeHudModel";
import { CONFIRMATION_COPY } from "./confirmationCopy";

export type ConfirmationModel = {
  locked: boolean;
  /** The pool has settled this day, so Results can open. */
  resultsReady: boolean;
  dayLabel: string;
  title: string;
  sub: string;
  pick: { id: ChoiceId; label: string } | null;
  freeSpent: number;
  freeRemaining: number;
  extraSpent: number;
  extraRemaining: number;
  closesAt: string;
  publishAt: string;
  resultsCta: string;
  /** Extra can still be bought only before the vote is locked. */
  canBuy: boolean;
  buyCta: string;
};

export function buildConfirmationModel(state: DayState): ConfirmationModel {
  const cast = state.status === "cast" ? state.casts.at(-1) : undefined;
  const locked = Boolean(cast);
  const choice = cast
    ? state.choices.find((item) => item.id === cast.optionId)
    : undefined;
  const resultsReady = state.settled;
  const publishAt = CONFIRMATION_COPY.publishAtSettle;
  const close = state.schedule.voteCloseAt;

  return {
    locked,
    resultsReady,
    dayLabel: `DAY ${padDay(state.day)}`,
    title: locked ? CONFIRMATION_COPY.titleLocked : CONFIRMATION_COPY.titleOpen,
    sub: locked ? CONFIRMATION_COPY.pending : CONFIRMATION_COPY.emptyBody,
    pick: choice ? { id: choice.id, label: choice.title } : null,
    freeSpent: cast?.free ?? 0,
    freeRemaining: state.freeInfluence,
    extraSpent: cast?.extra ?? 0,
    extraRemaining: state.extraInfluence,
    closesAt: close === null ? CONFIRMATION_COPY.closesAtSettle : formatLocalTime(close),
    publishAt,
    canBuy: !locked && state.votingOpen,
    buyCta: CONFIRMATION_COPY.buy,
    resultsCta: resultsReady
      ? CONFIRMATION_COPY.resultsCta
      : CONFIRMATION_COPY.resultsPending,
  };
}
