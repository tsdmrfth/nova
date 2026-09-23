import type { ConfirmationModel } from "./confirmationModel";
import "./ConfirmationHud.css";

type ConfirmationHudProps = {
  model: ConfirmationModel;
  onVote(): void;
  onBack(): void;
};

function padDay(day: number): string {
  return String(day).padStart(2, "0");
}

export function ConfirmationHud({ model, onVote, onBack }: ConfirmationHudProps) {
  const cards = model.cast && model.choice ? [model.choice] : model.choices;

  return (
    <div className="confirm-hud">
      <div className="confirm-panel">
        <header className="confirm-hero">
          <p className="confirm-kicker" data-testid="confirm-kicker">
            Day {padDay(model.day)} · {model.goal}
          </p>
          <h1 className="confirm-title" data-testid="confirm-heading">
            {model.heading}
          </h1>
          {model.cast ? (
            <p className="confirm-round" data-testid="confirm-round">
              {model.roundTitle}
            </p>
          ) : null}
          <p className="confirm-scene" data-testid="confirm-scene">
            {model.scene}
          </p>
        </header>

        {model.body ? (
          <p className="confirm-body" data-testid="confirm-body">
            {model.body}
          </p>
        ) : null}
        {model.leave ? (
          <p className="confirm-leave" data-testid="confirm-leave">
            {model.leave}
          </p>
        ) : null}

        <ul className="confirm-choices" data-testid="confirm-choices">
          {cards.map((choice) => (
            <li
              key={choice.id}
              className={
                model.choice?.id === choice.id
                  ? "confirm-choice confirm-choice--picked"
                  : "confirm-choice"
              }
              data-testid={`confirm-choice-${choice.id}`}
            >
              <span className="confirm-choice-id">{choice.id}</span>
              <span className="confirm-choice-world">{choice.world}</span>
              <span className="confirm-choice-title">{choice.title}</span>
              <span className="confirm-choice-caption">{choice.caption}</span>
              {choice.hook ? (
                <span className="confirm-choice-hook" data-testid="confirm-hook">
                  {choice.hook}
                </span>
              ) : null}
            </li>
          ))}
        </ul>

        <div className="confirm-actions">
          {model.cast ? (
            <button
              type="button"
              className="confirm-back"
              data-testid="confirm-back"
              onClick={onBack}
            >
              {model.back}
            </button>
          ) : (
            <button
              type="button"
              className="confirm-vote"
              data-testid="confirm-vote"
              onClick={onVote}
            >
              {model.voteCta}
              <span aria-hidden="true">›</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
