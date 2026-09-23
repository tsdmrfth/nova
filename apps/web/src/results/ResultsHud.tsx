import { useState } from "react";
import { getAssetUrl } from "@nova/assets";
import { ShieldIcon } from "../hud/hudIcons";
import { RESULTS_COPY, type ResultsHudModel } from "./resultsModel";
import "./ResultsHud.css";

type ResultsHudProps = {
  model: ResultsHudModel;
  onClaim(): void;
  onBack(): void;
  onVote(): void;
};

export function ResultsHud({
  model,
  onClaim,
  onBack,
  onVote,
}: ResultsHudProps) {
  const [shareNote, setShareNote] = useState<string | null>(null);
  const badgeUrl = getAssetUrl(model.badgeId);

  return (
    <div className="results-hud">
      <div className="results-panel">
        <header className="results-hero">
          {badgeUrl ? (
            <img
              className="results-badge"
              src={badgeUrl}
              alt=""
              data-testid="results-badge"
              draggable={false}
            />
          ) : (
            <span
              className="results-badge results-badge--fallback"
              data-testid="results-badge"
            />
          )}
          <h1 className="results-canon" data-testid="results-canon">
            {model.canon}
          </h1>
          <p className="results-world" data-testid="results-world">
            {model.winnerWorld}
          </p>
          <p className="results-goal" data-testid="results-goal">
            {model.goalLine}
          </p>
        </header>

        {model.needCast ? (
          <p className="results-need-cast" data-testid="results-need-cast">
            {model.needCast}
          </p>
        ) : null}

        {model.rollover ? (
          <p className="results-rollover" data-testid="results-rollover">
            {model.rollover}
          </p>
        ) : null}

        {model.miss ? (
          <p className="results-miss" data-testid="results-miss">
            {model.miss}
          </p>
        ) : null}

        {model.shareRows.length > 0 ? (
          <ul className="results-shares" data-testid="results-shares">
            {model.shareRows.map((row) => (
              <li
                key={row.id}
                className="results-share"
                data-testid={`results-share-${row.id}`}
              >
                {row.label}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="results-spark" data-testid="results-spark">
          <span className="results-spark-label">{model.sparkLabel}</span>
          <span className="results-spark-value">+{model.spark}</span>
          <span className="results-spark-hint">{model.sparkHint}</span>
        </div>

        <div className="results-actions">
          {model.claimEnabled || model.claimStatus === "claimed" ? (
            <button
              type="button"
              className="results-claim"
              data-testid="results-claim"
              disabled={!model.claimEnabled}
              onClick={onClaim}
            >
              {model.claimCta}
              {model.claimEnabled ? <span aria-hidden="true">›</span> : null}
            </button>
          ) : model.needCast ? (
            <button
              type="button"
              className="results-claim"
              data-testid="results-vote"
              onClick={onVote}
            >
              {model.voteCta}
              <span aria-hidden="true">›</span>
            </button>
          ) : null}

          <div className="results-secondary">
            <button
              type="button"
              className="results-share-btn"
              data-testid="results-share"
              onClick={() => setShareNote(RESULTS_COPY.shareDone)}
            >
              {shareNote ?? model.share}
            </button>
            <button
              type="button"
              className="results-back"
              data-testid="results-back"
              onClick={onBack}
            >
              {model.back}
            </button>
          </div>
        </div>

        <p className="results-disclaimer">
          <ShieldIcon className="results-disclaimer-icon" />
          Extra Influence does not make a pick more likely to win. SPARK is
          in-game points — not a token.
        </p>
      </div>
    </div>
  );
}
