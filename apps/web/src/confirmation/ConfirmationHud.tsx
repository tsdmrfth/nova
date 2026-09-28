import type { ConfirmationModel } from "./confirmationModel";
import "./ConfirmationHud.css";

type ConfirmationHudProps = {
  model: ConfirmationModel;
  onResults(): void;
  onVote(): void;
  onBuy(): void;
};

export function ConfirmationHud({
  model,
  onResults,
  onVote,
  onBuy,
}: ConfirmationHudProps) {
  return (
    <div className="confirm-hud">
      <div className="confirm-panel">
        <header className="confirm-hero">
          <p className="confirm-kicker" data-testid="confirmation-kicker">
            {model.kicker}
          </p>
          <h1 className="confirm-title" data-testid="confirmation-title">
            {model.title}
          </h1>
          <p className="confirm-day" data-testid="confirmation-day">
            {model.dayLine}
          </p>
          {model.pending ? (
            <p className="confirm-pending" data-testid="confirmation-pending">
              {model.pending}
            </p>
          ) : null}
        </header>

        {model.locked ? (
          <article className="confirm-card" data-testid="confirmation-choice">
            <p className="confirm-label">{model.choiceLabel}</p>
            <p className="confirm-value">{model.choiceLine}</p>
          </article>
        ) : (
          <p className="confirm-empty" data-testid="confirmation-empty">
            {model.emptyBody}
          </p>
        )}

        <div className="confirm-lanes">
          <article className="confirm-card" data-testid="confirmation-free">
            <p className="confirm-label">{model.freeLabel}</p>
            <p className="confirm-value">{model.freeOnPick}</p>
            <p className="confirm-meta">{model.freeRemaining}</p>
          </article>
          <article className="confirm-card" data-testid="confirmation-extra">
            <p className="confirm-label">{model.extraLabel}</p>
            <p className="confirm-value">{model.extraOnPick}</p>
            <p className="confirm-meta">{model.extraRemaining}</p>
          </article>
        </div>

        <div className="confirm-schedule">
          <p data-testid="confirmation-close">{model.closeLine}</p>
          <p data-testid="confirmation-publish">{model.publishLine}</p>
        </div>

        <div className="confirm-actions">
          {model.resultsReady ? (
            <button
              type="button"
              className="confirm-cta"
              data-testid="confirmation-results"
              onClick={onResults}
            >
              {model.resultsCta}
              <span aria-hidden="true">›</span>
            </button>
          ) : (
            <button
              type="button"
              className="confirm-cta"
              data-testid="confirmation-cast"
              onClick={onVote}
            >
              {model.castCta}
              <span aria-hidden="true">›</span>
            </button>
          )}
          <div className="confirm-secondary">
            <button
              type="button"
              className="confirm-link"
              data-testid="confirmation-back"
              onClick={onVote}
            >
              {model.back}
            </button>
            <button
              type="button"
              className="confirm-link"
              data-testid="confirmation-buy"
              onClick={onBuy}
            >
              {model.buy}
            </button>
          </div>
        </div>

        <p className="confirm-note">{model.lanes}</p>
      </div>
    </div>
  );
}
