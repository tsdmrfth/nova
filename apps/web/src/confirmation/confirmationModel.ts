import { formatLocalStamp, type DayState } from "../day/dayStore";
import { CONFIRMATION_COPY } from "./confirmationCopy";

export type ConfirmationModel = {
  locked: boolean;
  /** Offline slice: a locked cast may open Results without waiting on the clock. */
  resultsReady: boolean;
  kicker: string;
  dayLine: string;
  title: string;
  pending: string | null;
  emptyBody: string;
  choiceLabel: string;
  choiceLine: string;
  freeLabel: string;
  freeOnPick: string;
  freeRemaining: string;
  extraLabel: string;
  extraOnPick: string;
  extraRemaining: string;
  closeLine: string;
  publishLine: string;
  resultsCta: string;
  homeCta: string;
  castCta: string;
  back: string;
  buy: string;
  lanes: string;
};

function padDay(day: number): string {
  return String(day).padStart(2, "0");
}

export function buildConfirmationModel(state: DayState): ConfirmationModel {
  const cast = state.status === "cast" ? state.casts.at(-1) : undefined;
  const locked = Boolean(cast);
  const choice = cast
    ? state.choices.find((item) => item.id === cast.optionId)
    : undefined;

  return {
    locked,
    resultsReady: locked,
    kicker: CONFIRMATION_COPY.kicker,
    dayLine: `Day ${padDay(state.day)} · ${state.goal}`,
    title: locked ? CONFIRMATION_COPY.titleLocked : CONFIRMATION_COPY.titleOpen,
    pending: locked ? CONFIRMATION_COPY.pending : null,
    emptyBody: CONFIRMATION_COPY.emptyBody,
    choiceLabel: CONFIRMATION_COPY.choiceLabel,
    choiceLine: choice ? `${choice.world} · ${choice.title}` : "",
    freeLabel: CONFIRMATION_COPY.freeLabel,
    freeOnPick: locked
      ? CONFIRMATION_COPY.onPick(cast?.free ?? 0)
      : CONFIRMATION_COPY.notCast,
    freeRemaining: CONFIRMATION_COPY.remaining(state.freeInfluence),
    extraLabel: CONFIRMATION_COPY.extraLabel,
    extraOnPick: locked
      ? CONFIRMATION_COPY.onPick(cast?.extra ?? 0)
      : CONFIRMATION_COPY.notCast,
    extraRemaining: CONFIRMATION_COPY.remaining(state.extraInfluence),
    closeLine: `${CONFIRMATION_COPY.closeLabel} ${formatLocalStamp(state.schedule.voteCloseAt)}`,
    publishLine: `${CONFIRMATION_COPY.publishLabel} ${formatLocalStamp(state.schedule.publishAt)}`,
    resultsCta: CONFIRMATION_COPY.resultsCta,
    homeCta: CONFIRMATION_COPY.homeCta,
    castCta: CONFIRMATION_COPY.castCta,
    back: CONFIRMATION_COPY.back,
    buy: CONFIRMATION_COPY.buy,
    lanes: CONFIRMATION_COPY.lanes,
  };
}
