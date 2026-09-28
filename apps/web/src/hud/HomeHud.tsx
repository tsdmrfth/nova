import { getAssetUrl } from "@nova/assets";
import type { ChoiceId } from "@nova/assets";
import {
  CastInfluenceIcon,
  DayIcon,
  ExtraInfluenceIcon,
  FreeInfluenceIcon,
  GoalIcon,
  PlusIcon,
  RankIcon,
  ShieldIcon,
  UsdcIcon,
} from "./hudIcons";
import type { HudCallbacks, HudModel } from "./homeHudModel";
import "./HomeHud.css";

type HomeHudProps = Pick<
  HudCallbacks,
  "onSelect" | "onSpend" | "onCast" | "onUsdcChip" | "onBuyExtraPlus"
> & {
  model: HudModel;
  selected: ChoiceId | null;
  onConfirm?(): void;
  onExtraSpend?(amount: number): void;
};

function padDay(day: number): string {
  return String(day).padStart(2, "0");
}

export function HomeHud({
  model,
  selected,
  onSelect,
  onSpend,
  onExtraSpend,
  onCast,
  onUsdcChip,
  onBuyExtraPlus,
  onConfirm,
}: HomeHudProps) {
  const xpRatio =
    model.rankXp.next === 0
      ? 0
      : Math.min(1, model.rankXp.current / model.rankXp.next);
  const spendLocked = model.status !== "open";

  return (
    <div className="home-hud">
      <div className="hud-top">
        <div className="hud-chip-row">
          <div className="hud-chip" data-testid="hud-day">
            <span className="hud-chip-icon">
              <DayIcon />
            </span>
            <span className="hud-chip-copy">
              <span className="hud-chip-label">Day</span>
              <span className="hud-chip-value">{padDay(model.day)}</span>
            </span>
          </div>
          <div className="hud-chip" data-testid="day-goal">
            <span className="hud-chip-icon hud-chip-icon--glow">
              <GoalIcon />
            </span>
            <span className="hud-chip-copy">
              <span className="hud-chip-label">Day goal</span>
              <span className="hud-chip-value">{model.goal}</span>
            </span>
          </div>
        </div>

        <div className="hud-chip-row hud-chip-row--resources">
          <div
            className="hud-chip hud-chip--resource"
            data-testid="hud-free"
            title={model.freeHint}
          >
            <span className="hud-chip-icon hud-chip-icon--glow">
              <FreeInfluenceIcon />
            </span>
            <span className="hud-chip-copy">
              <span className="hud-chip-label">Free Influence</span>
              <span className="hud-chip-value" data-testid="hud-free-value">
                {model.freeInfluence}
              </span>
            </span>
          </div>
          <div className="hud-chip hud-chip--resource" data-testid="hud-extra">
            <span className="hud-chip-icon">
              <ExtraInfluenceIcon />
            </span>
            <span className="hud-chip-copy">
              <span className="hud-chip-label">Extra Influence</span>
              <span className="hud-chip-value" data-testid="hud-extra-value">
                {model.extraInfluence}
              </span>
            </span>
            <button
              type="button"
              className="hud-chip-plus"
              aria-label="Buy Extra Influence"
              onClick={onBuyExtraPlus}
            >
              <PlusIcon className="hud-chip-plus-icon" />
            </button>
          </div>
          <button
            type="button"
            className="hud-chip hud-chip--usdc"
            data-testid="hud-usdc"
            onClick={onUsdcChip}
          >
            <UsdcIcon className="hud-usdc-mark" />
            <span className="hud-chip-label">{model.usdcLabel}</span>
          </button>
        </div>

        {model.buyEntry ? (
          model.buyEntryToBuy ? (
            <button
              type="button"
              className="hud-buy-entry"
              data-testid="buy-entry"
              onClick={onBuyExtraPlus}
            >
              {model.buyEntry}
            </button>
          ) : (
            <p className="hud-buy-entry hud-buy-entry--hint" data-testid="buy-entry">
              {model.buyEntry}
            </p>
          )
        ) : null}
      </div>

      <div className="hud-center">
        <div className="hud-hero">
          <h1 className="hud-title">{model.heroTitle}</h1>
          <p className="hud-scene">{model.scene}</p>
          <p className="hud-sub">{model.heroSub}</p>
        </div>
        <div className="hud-choices">
          {model.choices.map((choice) => {
            const artUrl = getAssetUrl(choice.artId);
            const isSelected = selected === choice.id;
            return (
              <button
                key={choice.id}
                type="button"
                className={
                  isSelected
                    ? "choice-card choice-card--selected"
                    : "choice-card"
                }
                data-testid={`choice-${choice.id}`}
                aria-pressed={isSelected}
                disabled={spendLocked}
                onClick={() => onSelect(choice.id)}
              >
                <span className="choice-letter">{choice.id}</span>
                <span className="choice-label">{choice.label}</span>
                <span className="choice-self">{choice.title}</span>
                {artUrl ? (
                  <img
                    className="choice-art"
                    src={artUrl}
                    alt=""
                    draggable={false}
                  />
                ) : (
                  <span className="choice-art choice-art--fallback" />
                )}
                <span className="choice-body">{choice.body}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="hud-bottom">
        <div className="rank-card" data-testid="hud-rank">
          <span className="rank-icon">
            <RankIcon />
          </span>
          <span className="rank-copy">
            <span className="rank-title">{model.rankTitle}</span>
            <span className="rank-label">Influence Rank</span>
            <span
              className="rank-bar"
              role="progressbar"
              aria-label="Influence rank progress"
              aria-valuemin={0}
              aria-valuemax={model.rankXp.next}
              aria-valuenow={model.rankXp.current}
            >
              <span className="rank-bar-fill" style={{ width: `${xpRatio * 100}%` }} />
            </span>
            <span className="rank-xp">
              {model.rankXp.current.toLocaleString("en-US")} /{" "}
              {model.rankXp.next.toLocaleString("en-US")}
            </span>
          </span>
        </div>

        <div className="cast-panel">
          <div className="spend-lanes" data-testid="spend-split">
            <div className="spend-control" data-testid="spend-free">
              <span className="spend-label">Free to cast</span>
              <div className="spend-stepper">
                <button
                  type="button"
                  className="spend-button"
                  data-testid="spend-decrease"
                  aria-label="Decrease Free Influence"
                  disabled={spendLocked || model.spendAmount <= 0}
                  onClick={() => onSpend(model.spendAmount - 1)}
                >
                  −
                </button>
                <span
                  className="spend-value"
                  data-testid="spend-amount"
                  aria-live="polite"
                >
                  {model.spendAmount}
                </span>
                <button
                  type="button"
                  className="spend-button"
                  data-testid="spend-increase"
                  aria-label="Increase Free Influence"
                  disabled={spendLocked || model.spendAmount >= model.freeInfluence}
                  onClick={() => onSpend(model.spendAmount + 1)}
                >
                  +
                </button>
              </div>
            </div>
            <div className="spend-control" data-testid="spend-extra">
              <span className="spend-label">Extra to cast</span>
              <div className="spend-stepper">
                <button
                  type="button"
                  className="spend-button"
                  data-testid="spend-extra-decrease"
                  aria-label="Decrease Extra Influence"
                  disabled={spendLocked || model.extraSpendAmount <= 0}
                  onClick={() => onExtraSpend?.(model.extraSpendAmount - 1)}
                >
                  −
                </button>
                <span
                  className="spend-value"
                  data-testid="spend-extra-amount"
                  aria-live="polite"
                >
                  {model.extraSpendAmount}
                </span>
                <button
                  type="button"
                  className="spend-button"
                  data-testid="spend-extra-increase"
                  aria-label="Increase Extra Influence"
                  disabled={
                    spendLocked || model.extraSpendAmount >= model.extraInfluence
                  }
                  onClick={() => onExtraSpend?.(model.extraSpendAmount + 1)}
                >
                  +
                </button>
              </div>
            </div>
            <p className="spend-cap" data-testid="spend-cap">
              {model.spendCapHint}
            </p>
          </div>

          <button
            type="button"
            className="cast-button"
            data-testid="cast-influence"
            disabled={!model.castEnabled}
            aria-label="Cast Influence"
            aria-describedby="cast-preview-hint"
            onClick={onCast}
          >
            <CastInfluenceIcon className="cast-button-icon" />
            Cast Influence
            <span aria-hidden="true">›</span>
          </button>
          <p
            id="cast-preview-hint"
            className={
              model.status === "cast" ? "cast-status" : "cast-status cast-status--hint"
            }
            data-testid="cast-status"
          >
            {model.status === "cast" ? (
              <>
                <strong>{model.castMessage}</strong>
                <span>{model.castDetail}</span>
              </>
            ) : (
              model.castDetail
            )}
          </p>
          {model.confirmLabel ? (
            <button
              type="button"
              className="cast-button"
              data-testid="cast-confirm"
              onClick={onConfirm}
            >
              {model.confirmLabel}
              <span aria-hidden="true">›</span>
            </button>
          ) : null}
        </div>

      </div>

      <p className="hud-disclaimer">
        <ShieldIcon className="hud-disclaimer-icon" />
        {model.disclaimer}
      </p>
    </div>
  );
}
