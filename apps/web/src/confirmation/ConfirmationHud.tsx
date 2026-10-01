import type { ReactNode } from "react";
import { BackBar } from "../hud/HomeView";
import {
  Button,
  ChoiceCard,
  Chip,
  ClockIcon,
  ExtraIcon,
  FreeIcon,
  GlassSheet,
  Receipt,
  ReceiptDivider,
  SheetHeading,
  StatusOrb,
} from "../ui";
import { CONFIRMATION_COPY } from "./confirmationCopy";
import type { ConfirmationModel } from "./confirmationModel";
import "./confirmation.css";

type ConfirmationHudProps = {
  model: ConfirmationModel;
  onHome(): void;
  onResults(): void;
  onVote(): void;
  onBuy(): void;
};

function LaneBlock({
  icon,
  label,
  spent,
  remaining,
  testId,
}: {
  icon: ReactNode;
  label: string;
  spent: number;
  remaining: number;
  testId: string;
}) {
  return (
    <div className="confirm-lane" data-testid={testId}>
      {icon}
      <dl className="confirm-lane__grid">
        <dt>{label}</dt>
        <dd>{spent}</dd>
        <dt className="nv-muted">{CONFIRMATION_COPY.remaining}</dt>
        <dd className="nv-muted">{remaining}</dd>
      </dl>
    </div>
  );
}

/** Screen 07. Nova's head stays visible above the panel. */
export function ConfirmationHud({
  model,
  onHome,
  onResults,
  onVote,
  onBuy,
}: ConfirmationHudProps) {
  return (
    <>
      <div className="nv-top">
        <BackBar
          label={CONFIRMATION_COPY.backLabel}
          onBack={onVote}
          testId="confirmation-top-back"
          trailing={<Chip testId="confirmation-day">{model.dayLabel}</Chip>}
        />
      </div>

      <div className="nv-bottom">
        <GlassSheet
          testId="confirmation-sheet"
          orb={<StatusOrb kind={model.locked ? "check" : "x"} />}
          className="confirm-sheet"
        >
          <SheetHeading
            title={model.title}
            sub={model.sub}
            titleTestId="confirmation-title"
          />

          {model.pick ? (
            <div data-testid="confirmation-choice">
              <ChoiceCard letter={model.pick.id} label={model.pick.label} />
            </div>
          ) : (
            <p className="nv-note" data-testid="confirmation-empty">
              {CONFIRMATION_COPY.emptyBody}
            </p>
          )}

          <Receipt testId="confirmation-receipt">
            <LaneBlock
              icon={<FreeIcon size={22} className="nv-icon-accent" />}
              label={CONFIRMATION_COPY.freeSpent}
              spent={model.freeSpent}
              remaining={model.freeRemaining}
              testId="confirmation-free"
            />
            <ReceiptDivider />
            <LaneBlock
              icon={<ExtraIcon size={22} className="nv-icon-accent" />}
              label={CONFIRMATION_COPY.extraSpent}
              spent={model.extraSpent}
              remaining={model.extraRemaining}
              testId="confirmation-extra"
            />
            <ReceiptDivider />
            <div className="confirm-lane">
              <ClockIcon className="nv-icon-accent" />
              <dl className="confirm-lane__grid confirm-lane__grid--times">
                <dt className="nv-muted">{CONFIRMATION_COPY.closeLabel}</dt>
                <dd data-testid="confirmation-close">{model.closesAt}</dd>
                <dt className="nv-muted">{CONFIRMATION_COPY.publishLabel}</dt>
                <dd data-testid="confirmation-publish">{model.publishAt}</dd>
              </dl>
            </div>
          </Receipt>

          <Button testId="confirmation-home" onClick={onHome}>
            {CONFIRMATION_COPY.homeCta}
          </Button>
          {model.locked ? (
            <Button
              variant="tertiary"
              compact
              testId="confirmation-results"
              disabled={!model.resultsReady}
              onClick={onResults}
            >
              {model.resultsCta}
            </Button>
          ) : null}
          <Button variant="tertiary" compact testId="confirmation-back" onClick={onVote}>
            {model.locked ? CONFIRMATION_COPY.back : CONFIRMATION_COPY.castCta}
          </Button>
          <Button variant="secondary" compact testId="confirmation-buy" onClick={onBuy}>
            {CONFIRMATION_COPY.buy}
          </Button>
        </GlassSheet>
      </div>
    </>
  );
}
