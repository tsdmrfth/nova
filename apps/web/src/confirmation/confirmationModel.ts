import type { ChoiceId } from "@nova/assets";
import { S1_COPY } from "../content/s1Copy";
import { playerFacingIfWins } from "../content/season1";
import { formatLocalStamp, type DayState } from "../day/dayStore";

export type ConfirmationChoice = {
  id: ChoiceId;
  world: string;
  title: string;
  caption: string;
  hook: string | null;
};

export type ConfirmationModel = {
  day: number;
  roundTitle: string;
  scene: string;
  goal: DayState["goal"];
  cast: boolean;
  heading: string;
  body: string | null;
  leave: string | null;
  choice: ConfirmationChoice | null;
  choices: readonly ConfirmationChoice[];
  voteCta: string;
  back: string;
};

function toChoice(choice: DayState["choices"][number]): ConfirmationChoice {
  return {
    id: choice.id,
    world: choice.world,
    title: choice.title,
    caption: choice.caption,
    hook: playerFacingIfWins(choice.ifWins),
  };
}

/**
 * Confirmation reads the active round plus COPY-S1 B5.
 * Cast is synchronous here, so "Saving your cast…" stays in the copy pack
 * until a real pending state exists.
 */
export function buildConfirmationModel(state: DayState): ConfirmationModel {
  const choices = state.choices.map(toChoice);
  const cast = state.casts.at(-1);
  const picked = cast
    ? (choices.find((choice) => choice.id === cast.optionId) ?? null)
    : null;

  if (state.status === "cast" && picked) {
    return {
      day: state.day,
      roundTitle: state.roundTitle,
      scene: state.scene,
      goal: state.goal,
      cast: true,
      heading: S1_COPY.castSuccess,
      body: S1_COPY.confirmLocked(
        formatLocalStamp(state.schedule.voteCloseAt),
        formatLocalStamp(state.schedule.publishAt),
      ),
      leave: S1_COPY.pendingLeave,
      choice: picked,
      choices,
      voteCta: S1_COPY.voteCta,
      back: S1_COPY.back,
    };
  }

  return {
    day: state.day,
    roundTitle: state.roundTitle,
    scene: state.scene,
    goal: state.goal,
    cast: false,
    heading: state.roundTitle,
    body: null,
    leave: null,
    choice: null,
    choices,
    voteCta: S1_COPY.voteCta,
    back: S1_COPY.back,
  };
}
