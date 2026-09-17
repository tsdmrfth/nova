import { getAssetUrl } from "@nova/assets";
import type { ChoiceId } from "@nova/assets";
import {
  DayIcon,
  ExtraInfluenceIcon,
  FreeInfluenceIcon,
  RankIcon,
  ShieldIcon,
  UsdcIcon,
} from "./hudIcons";
import type { HudCallbacks, HudModel } from "./homeHudModel";
import "./HomeHud.css";

type HomeHudProps = Pick<HudCallbacks, "onSelect" | "onCast" | "onUsdcChip"> & {
  model: HudModel;
  selected: ChoiceId | null;
};

function padDay(day: number): string {
  return String(day).padStart(2, "0");
}

export function HomeHud({
  model,
  selected,
  onSelect,
  onCast,
  onUsdcChip,
}: HomeHudProps) {
  const xpRatio =
    model.rankXp.next === 0
      ? 0
      : Math.min(1, model.rankXp.current / model.rankXp.next);

  return (
    <div className="home-hud">
      <div className="hud-top">
        <div className="hud-chip" data-testid="hud-day">
          <span className="hud-chip-icon">
            <DayIcon />
          </span>
          <span className="hud-chip-copy">
            <span className="hud-chip-label">Day</span>
            <span className="hud-chip-value">{padDay(model.day)}</span>
          </span>
        </div>

        <div className="hud-meter">
          <div className="hud-chip hud-chip--resource" data-testid="hud-free">
            <span className="hud-chip-icon hud-chip-icon--glow">
              <FreeInfluenceIcon />
            </span>
            <span className="hud-chip-copy">
              <span className="hud-chip-label">Free Influence</span>
              <span className="hud-chip-value">{model.freeInfluence}</span>
            </span>
          </div>
          <span className="hud-plus" aria-hidden="true">
            +
          </span>
          <div className="hud-chip hud-chip--resource" data-testid="hud-extra">
            <span className="hud-chip-icon">
              <ExtraInfluenceIcon />
            </span>
            <span className="hud-chip-copy">
              <span className="hud-chip-label">Extra Influence</span>
              <span className="hud-chip-value">{model.extraInfluence}</span>
            </span>
          </div>
          <span className="hud-plus" aria-hidden="true">
            +
          </span>
          <button
            type="button"
            className="hud-chip hud-chip--usdc"
            data-testid="hud-usdc"
            onClick={onUsdcChip}
          >
            <span className="hud-chip-label">{model.usdcLabel}</span>
            <UsdcIcon className="hud-usdc-mark" />
          </button>
        </div>
      </div>

      <div className="hud-center">
        <div className="hud-hero">
          <h1 className="hud-title">{model.heroTitle}</h1>
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
                onClick={() => onSelect(choice.id)}
              >
                <span className="choice-letter">{choice.id}</span>
                <span className="choice-label">{choice.label}</span>
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

        <button
          type="button"
          className="cast-button"
          data-testid="cast-influence"
          disabled={!model.castEnabled}
          aria-label="Cast Influence"
          aria-describedby="cast-preview-hint"
          onClick={onCast}
        >
          Cast Influence
          <span aria-hidden="true">›</span>
        </button>
        <span id="cast-preview-hint" className="sr-only">
          Vote submission is not available in this preview.
        </span>

        <div className="hud-brand" aria-hidden="true">
          <span className="hud-brand-name">Arc</span>
          <span className="hud-brand-tag">People build brighter tomorrow</span>
        </div>
      </div>

      <p className="hud-disclaimer">
        <ShieldIcon className="hud-disclaimer-icon" />
        {model.disclaimer}
      </p>
    </div>
  );
}
