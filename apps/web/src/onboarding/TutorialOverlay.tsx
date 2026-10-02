import type { DayGoal } from "@nova/shared";
import { Button, GlassSheet, Kicker, StoryTitle } from "../ui";
import { ONBOARDING_COPY } from "./onboardingCopy";

type TutorialOverlayProps = {
  goal: DayGoal;
  onGotIt(): void;
  onSkip(): void;
};

/** Screen 04. Shown once after the toast; reopen from Menu › Help. */
export function TutorialOverlay({ goal, onGotIt, onSkip }: TutorialOverlayProps) {
  return (
    <GlassSheet
      variant="modal"
      testId="tutorial-overlay"
      role="dialog"
      ariaModal
      labelledBy="tutorial-title"
      className="oboard-tutorial"
    >
      <div className="nv-stack">
        <Kicker>{ONBOARDING_COPY.tutorialKicker}</Kicker>
        <StoryTitle size="md" id="tutorial-title">
          {ONBOARDING_COPY.tutorialTitle}
        </StoryTitle>
      </div>
      <ol className="oboard-steps">
        {ONBOARDING_COPY.tutorialSteps(goal).map((step, index) => (
          <li key={step.title}>
            <span className="oboard-steps__n">{index + 1}</span>
            <span className="oboard-steps__copy">
              <span className="oboard-steps__title">{step.title}</span>
              <span>{step.body}</span>
            </span>
          </li>
        ))}
      </ol>
      <div className="nv-grid-1-2">
        <Button variant="tertiary" testId="tutorial-skip" onClick={onSkip}>
          {ONBOARDING_COPY.tutorialSkip}
        </Button>
        <Button testId="tutorial-got-it" onClick={onGotIt}>
          {ONBOARDING_COPY.tutorialGotIt}
        </Button>
      </div>
    </GlassSheet>
  );
}
