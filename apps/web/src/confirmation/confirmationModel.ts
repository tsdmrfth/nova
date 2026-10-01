import type { ChoiceId } from "@nova/assets";
import { formatLocalTime, type DayState } from "../day/dayStore";
import { padDay } from "../hud/homeHudModel";
import { CONFIRMATION_COPY } from "./confirmationCopy";

export type ConfirmationModel = {
  locked: boolean;
  /** Offline slice: a locked cast may open Results without waiting on the clock. */
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
};

export function buildConfirmationModel(state: DayState): ConfirmationModel {
  const cast = state.status === "cast" ? state.casts.at(-1) : undefined;
  const locked = Boolean(cast);
  const choice = cast
    ? state.choices.find((item) => item.id === cast.optionId)
    : undefined;
  const resultsReady = locked;
  const publishAt = formatLocalTime(state.schedule.publishAt);

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
    extraRemaining: Math.max(0, state.extraInfluence - (cast?.extra ?? 0)),
    closesAt: formatLocalTime(state.schedule.voteCloseAt),
    publishAt,
    resultsCta: resultsReady
      ? CONFIRMATION_COPY.resultsCta
      : CONFIRMATION_COPY.resultsAt(publishAt),
  };
}
