import { ONBOARDING_COPY } from "./onboardingCopy";
import "./onboarding.css";

type TutorialOverlayProps = {
  onGotIt(): void;
  onSkip(): void;
};

export function TutorialOverlay({ onGotIt, onSkip }: TutorialOverlayProps) {
  return (
    <div className="oboard-overlay" data-testid="tutorial-overlay">
      <section
        className="oboard-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
      >
        <p className="oboard-kicker">{ONBOARDING_COPY.tutorialKicker}</p>
        <h1 className="oboard-title" id="tutorial-title">
          {ONBOARDING_COPY.tutorialTitle}
        </h1>
        <ol className="oboard-steps">
          {ONBOARDING_COPY.tutorialSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <div className="oboard-actions">
          <button
            type="button"
            className="oboard-cta"
            data-testid="tutorial-got-it"
            onClick={onGotIt}
          >
            {ONBOARDING_COPY.tutorialGotIt}
            <span aria-hidden="true">›</span>
          </button>
          <button
            type="button"
            className="oboard-secondary"
            data-testid="tutorial-skip"
            onClick={onSkip}
          >
            {ONBOARDING_COPY.tutorialSkip}
          </button>
        </div>
      </section>
    </div>
  );
}
