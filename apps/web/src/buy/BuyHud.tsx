import type { PackId } from "@nova/shared";
import { BackBar } from "../hud/HomeView";
import {
  Button,
  Chip,
  ExtraIcon,
  GlassSheet,
  InfoLine,
  Note,
  ReceiptDivider,
  StoryTitle,
} from "../ui";
import { BUY_COPY } from "./buyCopy";
import type { BuyHudModel } from "./buyModel";
import "./BuyHud.css";

type BuyHudProps = {
  model: BuyHudModel;
  selectedPackId: PackId;
  onSelectPack(id: PackId): void;
  onBuy(): void;
  onBack(): void;
};

/** Screen 12. Packs come from PACK_CATALOG; fee labels from @nova/shared. */
export function BuyHud({ model, selectedPackId, onSelectPack, onBuy, onBack }: BuyHudProps) {
  return (
    <>
      <div className="nv-top">
        <BackBar
          label={BUY_COPY.backLabel}
          onBack={onBack}
          testId="buy-back"
          trailing={
            <Chip testId="buy-extra" ariaLabel={`${model.extraLabel} ${model.extraInfluence}`}>
              <ExtraIcon size={18} className="nv-icon-accent" />
              <span className="buy-balance" data-testid="buy-extra-value">
                {model.extraInfluence}
              </span>
            </Chip>
          }
        />
      </div>

      <div className="nv-bottom">
        <GlassSheet className="buy-sheet" testId="buy-sheet">
          <header className="nv-stack buy-head">
            <StoryTitle size="sm">{model.headline}</StoryTitle>
            <p className="buy-sub">{BUY_COPY.sub}</p>
          </header>

          <div className="buy-packs" role="group" aria-label="Packs">
            {model.packs.map((pack) => {
              const selected = selectedPackId === pack.id;
              return (
                <button
                  key={pack.id}
                  type="button"
                  className={selected ? "buy-pack buy-pack--selected" : "buy-pack"}
                  data-testid={`buy-pack-${pack.id}`}
                  aria-pressed={selected}
                  aria-label={`${pack.name}: ${pack.priceLabel} for ${pack.extraLabel}`}
                  onClick={() => onSelectPack(pack.id)}
                >
                  {pack.badge ? <span className="buy-pack__badge">{pack.badge}</span> : null}
                  <span className="buy-pack__price">{pack.price}</span>
                  <span className="buy-pack__unit">USDC</span>
                  <span className="buy-pack__extra">{pack.extraLabel}</span>
                </button>
              );
            })}
          </div>

          <section
            className="buy-split nv-receipt"
            data-testid="buy-breakdown"
            aria-label={model.feeOneLiner}
          >
            <p className="nv-kicker nv-kicker--muted">{model.splitTitle}</p>
            <div className="buy-split__bar" aria-hidden="true">
              <i className="buy-split__seg buy-split__seg--pool" style={{ flex: model.split.prizePool }} />
              <i className="buy-split__seg buy-split__seg--studio" style={{ flex: model.split.studioNet }} />
              <i className="buy-split__seg buy-split__seg--nova" style={{ flex: model.split.novaBudget }} />
            </div>
            <dl className="buy-rows">
              <div className="buy-row">
                <dt>
                  <i className="buy-dot buy-split__seg--pool" />
                  {`${BUY_COPY.prizePool} · ${model.breakdown.prizePoolPct}`}
                </dt>
                <dd data-testid="buy-prize-pool">{model.breakdown.prizePool}</dd>
              </div>
              <div className="buy-row">
                <dt>
                  <i className="buy-dot buy-split__seg--studio" />
                  {`${BUY_COPY.studioNet} · ${model.breakdown.studioNetPct}`}
                </dt>
                <dd data-testid="buy-studio-net">{model.breakdown.studioNet}</dd>
              </div>
              <div className="buy-row">
                <dt>
                  <i className="buy-dot buy-split__seg--nova" />
                  {`${BUY_COPY.novaBudget} · ${model.breakdown.novaBudgetPct}`}
                </dt>
                <dd data-testid="buy-nova-budget">{model.breakdown.novaBudget}</dd>
              </div>
              <ReceiptDivider />
              <div className="buy-row">
                <dt>{BUY_COPY.youPay}</dt>
                <dd data-testid="buy-you-pay">{model.breakdown.youPay}</dd>
              </div>
              <div className="buy-row buy-row--strong">
                <dt>{BUY_COPY.youReceive}</dt>
                <dd data-testid="buy-you-receive">{model.breakdown.youReceive}</dd>
              </div>
            </dl>
          </section>

          <InfoLine testId="buy-value">{model.valueProp}</InfoLine>

          <Button
            testId="buy-cta"
            disabled={!model.ctaEnabled}
            title={model.ctaDisabledReason ?? undefined}
            onClick={onBuy}
          >
            {model.cta}
          </Button>

          {model.status ? <Note testId="buy-status">{model.status}</Note> : null}
          {model.ctaDisabledReason ? (
            <Note testId="buy-cap">{model.ctaDisabledReason}</Note>
          ) : model.capHint ? (
            <Note testId="buy-cap-hint">{model.capHint}</Note>
          ) : null}

          <Note testId="buy-footnotes">
            {`${model.noGuarantee} ${model.dailyBuyCap} ${model.contest} ${model.affiliation}`}
          </Note>
        </GlassSheet>
      </div>
    </>
  );
}
