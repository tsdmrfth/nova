import type { ChoiceId } from "@nova/assets";
import { Button, ChoiceCard, Chip, GlassSheet, Note, ReceiptDivider, Stepper, StoryTitle } from "../ui";
import { BackBar, BalanceRow } from "./HomeView";
import { HUD_COPY, type VoteModel } from "./homeHudModel";
import "./hud.css";

type VoteViewProps = {
  model: VoteModel;
  onBack(): void;
  onSelect(id: ChoiceId): void;
  onSpend(amount: number): void;
  onExtraSpend(amount: number): void;
  onCast(): void;
  onViewLocked(): void;
  onBuyExtra(): void;
};

/** Screen 06. Two independent steppers, never a combined total. */
export function VoteView({
  model,
  onBack,
  onSelect,
  onSpend,
  onExtraSpend,
  onCast,
  onViewLocked,
  onBuyExtra,
}: VoteViewProps) {
  return (
    <>
      <div className="nv-top">
        <BackBar
          label={HUD_COPY.backLabel}
          onBack={onBack}
          testId="vote-back"
          trailing={<Chip testId="hud-day">{model.dayLabel}</Chip>}
        />
        <BalanceRow model={model} onBuyExtra={onBuyExtra} />
      </div>

      <header className="hud-vote-head nv-plate-copy">
        <StoryTitle size="lg">{HUD_COPY.voteTitle}</StoryTitle>
        <p className="nv-body">{HUD_COPY.voteSub}</p>
      </header>

      <div className="nv-bottom nv-stack--10">
        <div className="nv-stack" role="group" aria-label="Today's choices">
          {model.choices.map((choice) => (
            <ChoiceCard
              key={choice.id}
              compact
              letter={choice.id}
              label={choice.label}
              selected={choice.selected}
              trailing="check"
              disabled={model.locked}
              testId={`choice-${choice.id}`}
              onClick={() => onSelect(choice.id)}
            />
          ))}
        </div>

        <GlassSheet className="hud-cast-sheet" testId="spend-split">
          <Stepper
            lane="free"
            value={model.spendAmount}
            meta={model.freeMeta}
            onChange={onSpend}
            canDecrease={model.canDecreaseFree}
            canIncrease={model.canIncreaseFree}
            testIds={{
              root: "spend-free",
              value: "spend-amount",
              decrease: "spend-decrease",
              increase: "spend-increase",
            }}
          />
          <ReceiptDivider />
          <Stepper
            lane="extra"
            value={model.extraSpendAmount}
            meta={model.extraMeta}
            onChange={onExtraSpend}
            canDecrease={model.canDecreaseExtra}
            canIncrease={model.canIncreaseExtra}
            testIds={{
              root: "spend-extra",
              value: "spend-extra-amount",
              decrease: "spend-extra-decrease",
              increase: "spend-extra-increase",
            }}
          />
        </GlassSheet>

        <Note testId="spend-cap" id="cast-lanes-hint">
          {model.lanes}
        </Note>

        {model.buyEntry ? (
          model.buyEntryToBuy ? (
            <Button variant="secondary" compact testId="buy-entry" onClick={onBuyExtra}>
              {model.buyEntry}
            </Button>
          ) : (
            <Note testId="buy-entry">{model.buyEntry}</Note>
          )
        ) : null}

        {model.locked ? (
          <Button testId="cast-influence" onClick={onViewLocked}>
            {model.castLabel}
          </Button>
        ) : (
          <Button
            testId="cast-influence"
            disabled={!model.castEnabled}
            describedBy="cast-lanes-hint"
            onClick={onCast}
          >
            {model.castLabel}
          </Button>
        )}
      </div>
    </>
  );
}
