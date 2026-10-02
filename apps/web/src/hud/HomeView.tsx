import type { ReactNode } from "react";
import type { ChoiceId } from "@nova/assets";
import { BUY_COPY } from "../buy/buyCopy";
import {
  BalanceChip,
  Button,
  ChevronLeftIcon,
  ChoiceCard,
  Chip,
  Kicker,
  MenuIcon,
  RankBar,
  StoryTitle,
} from "../ui";
import type { HudChrome, HomeModel } from "./homeHudModel";
import "./hud.css";

/** FREE / EXTRA balances. EXTRA opens Buy (UI-KIT-V2 guardrail 1). */
export function BalanceRow({
  model,
  onBuyExtra,
}: {
  model: HudChrome;
  onBuyExtra(): void;
}) {
  return (
    <div className="nv-grid-2">
      <BalanceChip
        lane="free"
        value={model.freeInfluence}
        testId="hud-free"
        valueTestId="hud-free-value"
        title={model.freeHint}
      />
      <BalanceChip
        lane="extra"
        value={model.extraInfluence}
        testId="hud-extra"
        valueTestId="hud-extra-value"
        ariaLabel={`Extra Influence ${model.extraInfluence}. ${BUY_COPY.needMore}`}
        onClick={onBuyExtra}
      />
    </div>
  );
}

/** Back chip + DAY chip used by Vote and Buy. */
export function BackBar({
  label,
  onBack,
  trailing,
  testId,
}: {
  label: string;
  onBack(): void;
  trailing: ReactNode;
  testId?: string;
}) {
  return (
    <div className="nv-top__row">
      <Chip grow onClick={onBack} testId={testId} ariaLabel={`Back · ${label}`}>
        <ChevronLeftIcon size={18} />
        {label}
      </Chip>
      {trailing}
    </div>
  );
}

type HomeViewProps = {
  model: HomeModel;
  onPick(id: ChoiceId): void;
  onPrimary(): void;
  onBuyExtra(): void;
  onMenu(): void;
};

/** Screen 05. Story copy sits on the plate at ~60% width so Nova stays clear. */
export function HomeView({ model, onPick, onPrimary, onBuyExtra, onMenu }: HomeViewProps) {
  return (
    <>
      <div className="nv-top">
        <div className="nv-top__row">
          <Chip testId="hud-day">{model.dayLabel}</Chip>
          <Chip shape="pill" testId="day-goal">
            GOAL · <b>{model.goal}</b>
          </Chip>
          <span className="nv-spacer" />
          <Chip onClick={onMenu} testId="hud-menu" ariaLabel="Open menu">
            <MenuIcon size={18} />
            MENU
          </Chip>
        </div>
        <BalanceRow model={model} onBuyExtra={onBuyExtra} />
      </div>

      <article className="hud-chapter nv-plate-copy nv-text-plate" data-testid="hud-chapter">
        <Kicker>{model.chapterLabel}</Kicker>
        <StoryTitle size="md" testId="hud-title">
          {model.title}
        </StoryTitle>
        <p className="nv-body" data-testid="hud-scene">
          {model.scene}
        </p>
      </article>

      <div className="nv-bottom">
        {model.choices.map((choice) => (
          <ChoiceCard
            key={choice.id}
            letter={choice.id}
            label={choice.label}
            selected={model.locked && choice.selected}
            trailing={model.locked ? "check" : "chevron"}
            testId={`choice-${choice.id}`}
            onClick={() => onPick(choice.id)}
          />
        ))}
        <RankBar
          title={model.rankTitle}
          current={model.rankXp.current}
          next={model.rankXp.next}
          testId="hud-rank"
        />
        <Button testId="home-cta" onClick={onPrimary}>
          {model.ctaLabel}
        </Button>
      </div>
    </>
  );
}
