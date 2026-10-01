import {
  BookIcon,
  Button,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChoiceCard,
  Chip,
  ExternalIcon,
  FreeIcon,
  GlassSheet,
  NetworkIcon,
  Note,
  Receipt,
  ReceiptDivider,
  ReceiptRow,
  SheetHeading,
  StatusOrb,
} from "../ui";
import { RESULTS_COPY, type ResultsHudModel } from "./resultsModel";
import "./ResultsHud.css";

/** DAY 07 | RESULTS chip; back goes Home. */
export function ResultsTopChip({ dayLabel, onBack }: { dayLabel: string; onBack(): void }) {
  return (
    <div className="nv-top__row">
      <Chip onClick={onBack} testId="results-top" ariaLabel={`${dayLabel} results · back to Nova`}>
        <ChevronLeftIcon size={18} />
        {dayLabel}
        <span className="nv-chip__sep" />
        {RESULTS_COPY.topLabel}
      </Chip>
    </div>
  );
}

type ResultsHudProps = {
  model: ResultsHudModel;
  calm: boolean;
  onClaim(): void;
  onBack(): void;
  onVote(): void;
};

/** Screens 08 (matched) and 09 (not this round, rollover, need-cast). */
export function ResultsHud({ model, calm, onClaim, onBack, onVote }: ResultsHudProps) {
  const matched = model.variant === "matched";
  const voted = model.variant !== "needCast";

  return (
    <>
      <div className="nv-top">
        <ResultsTopChip dayLabel={model.dayLabel} onBack={onBack} />
      </div>

      <div className="nv-bottom">
        <GlassSheet
          testId={`results-${model.variant}`}
          className="results-sheet"
          orb={
            <StatusOrb kind={matched ? "trophy" : "x"} glow={matched && !calm} testId="results-badge" />
          }
        >
          <SheetHeading title={model.title} sub={model.sub} titleTestId="results-title" />

          <div data-testid="results-winner">
            <ChoiceCard
              compact
              letter={model.winnerId}
              label={model.winnerTitle}
              selected={matched}
              trailing={matched ? "none" : "winner"}
            />
          </div>

          {model.pickId ? (
            <p className="results-pick" data-testid="results-pick">
              {`${RESULTS_COPY.yourPick} · `}
              <b>{model.pickId}</b>
              {matched ? (
                <span className="results-pick__check" aria-label="matched">
                  <CheckIcon size={12} />
                </span>
              ) : null}
            </p>
          ) : null}

          {voted ? (
            <Receipt testId="results-shares">
              <ReceiptRow label={RESULTS_COPY.dayPool} value={model.dayPool} />
              <ReceiptRow label={model.paidLaneLabel} value={model.paidLane} mutedLabel />
              <ReceiptRow label={model.freeLaneLabel} value={model.freeLane} mutedLabel />
              <ReceiptDivider />
              <ReceiptRow
                label={RESULTS_COPY.yourExtra}
                value={model.yourExtra}
                mutedValue={model.paidShare === 0n}
                testId="results-share-paid"
              />
              <ReceiptRow
                label={RESULTS_COPY.yourFree}
                value={model.yourFree}
                mutedValue={model.freeShare === 0n}
                testId="results-share-free"
              />
              {matched ? (
                <>
                  <ReceiptDivider />
                  <ReceiptRow label={RESULTS_COPY.claimable} value={model.claimable} strong />
                </>
              ) : null}
            </Receipt>
          ) : null}

          {matched ? <Note>{RESULTS_COPY.lanesNote}</Note> : null}

          {!matched && voted ? (
            <div className="nv-card" data-testid="results-tease">
              <span className="results-tease__icon">
                <BookIcon size={22} className="nv-icon-accent" />
              </span>
              <span className="nv-card__copy">
                <span className="nv-kicker nv-kicker--accent">{model.teaseKicker}</span>
                <span className="results-tease__title">{model.teaseTitle}</span>
              </span>
              <ChevronRightIcon size={18} />
            </div>
          ) : null}

          {model.variant === "needCast" ? (
            <Button testId="results-vote" onClick={onVote}>
              {RESULTS_COPY.voteCta}
            </Button>
          ) : null}

          {matched && model.claimStatus === "claimed" ? (
            <span className="results-claimed" data-testid="results-claim">
              <CheckIcon size={14} />
              {RESULTS_COPY.claimed}
            </span>
          ) : null}
          {matched && model.claimStatus !== "claimed" && model.totalShare > 0n ? (
            <Button testId="results-claim" disabled={!model.claimEnabled} onClick={onClaim}>
              {model.claimCta}
            </Button>
          ) : null}

          <Button
            variant={matched ? "secondary" : voted ? "primary" : "tertiary"}
            testId="results-back"
            onClick={onBack}
          >
            {RESULTS_COPY.back}
          </Button>
        </GlassSheet>
      </div>
    </>
  );
}

type ClaimSheetProps = {
  model: ResultsHudModel;
  calm: boolean;
  explorerUrl: string | null;
  onRetry(): void;
  onBack(): void;
};

/** Screen 10 (pending / failed). */
export function ClaimPendingSheet({ model, calm, explorerUrl, onRetry, onBack }: ClaimSheetProps) {
  const failed = model.claimStatus === "failed";
  return (
    <>
      <div className="nv-top">
        <ResultsTopChip dayLabel={model.dayLabel} onBack={onBack} />
      </div>
      <div className="nv-bottom">
        <GlassSheet testId={failed ? "claim-failed" : "claim-pending"} className="results-claim-sheet">
          {failed ? (
            <div className="results-claim-sheet__orb">
              <StatusOrb kind="x" />
            </div>
          ) : (
            <StatusOrb kind="spinner" calm={calm} testId="claim-spinner" />
          )}
          <SheetHeading
            title={failed ? RESULTS_COPY.failedTitle : RESULTS_COPY.pendingTitle}
            sub={failed ? RESULTS_COPY.failedSub : RESULTS_COPY.pendingSub}
            titleTestId="claim-title"
          />
          <Receipt>
            <ReceiptRow
              icon={<FreeIcon className="nv-icon-accent" />}
              label={RESULTS_COPY.claimAmount}
              value={model.claimable}
            />
            <ReceiptRow
              icon={<NetworkIcon className="nv-icon-accent" />}
              label={RESULTS_COPY.network}
              value={RESULTS_COPY.networkValue}
            />
          </Receipt>
          {explorerUrl ? (
            <a className="nv-btn nv-btn--secondary" href={explorerUrl} target="_blank" rel="noreferrer">
              {RESULTS_COPY.viewTx}
              <ExternalIcon size={15} />
            </a>
          ) : null}
          {failed ? (
            <Button testId="claim-retry" onClick={onRetry}>
              {RESULTS_COPY.retry}
            </Button>
          ) : (
            <>
              <Note>{RESULTS_COPY.pendingNote}</Note>
              <Button pending testId="claim-confirming">
                {RESULTS_COPY.confirming}
              </Button>
            </>
          )}
          <Button variant="tertiary" testId="claim-back" onClick={onBack}>
            {RESULTS_COPY.back}
          </Button>
        </GlassSheet>
      </div>
    </>
  );
}

/** Screen 11. */
export function ClaimDoneSheet({
  model,
  explorerUrl,
  onBack,
}: Omit<ClaimSheetProps, "onRetry" | "calm">) {
  return (
    <>
      <div className="nv-top">
        <ResultsTopChip dayLabel={model.dayLabel} onBack={onBack} />
      </div>
      <div className="nv-bottom">
        <GlassSheet testId="claim-done" orb={<StatusOrb kind="check" />} className="results-claim-sheet">
          <SheetHeading title={RESULTS_COPY.doneTitle} sub={RESULTS_COPY.doneSub} titleTestId="claim-title" />
          <Receipt>
            <ReceiptRow label={RESULTS_COPY.amount} value={<b>{model.claimable}</b>} />
            <ReceiptRow label={RESULTS_COPY.to} value={RESULTS_COPY.toValue} mutedLabel />
            <ReceiptRow label={RESULTS_COPY.network} value={RESULTS_COPY.networkValue} mutedLabel />
          </Receipt>
          {explorerUrl ? (
            <a className="nv-btn nv-btn--secondary" href={explorerUrl} target="_blank" rel="noreferrer">
              {RESULTS_COPY.explorer}
              <ExternalIcon size={15} />
            </a>
          ) : null}
          <Button testId="claim-done-back" onClick={onBack}>
            {RESULTS_COPY.back}
          </Button>
        </GlassSheet>
      </div>
    </>
  );
}
