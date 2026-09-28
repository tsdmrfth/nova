import { getAssetUrl } from "@nova/assets";
import type { PackId } from "@nova/shared";
import {
  ExtraInfluenceIcon,
  FreeInfluenceIcon,
  ShieldIcon,
} from "../hud/hudIcons";
import { BUY_COPY } from "./buyCopy";
import type { BuyHudModel } from "./buyModel";
import "./BuyHud.css";

type BuyHudProps = {
  model: BuyHudModel;
  selectedPackId: PackId;
  onSelectPack(id: PackId): void;
  onBuy(): void;
  onBack(): void;
  onConfirm?(): void;
};

export function BuyHud({
  model,
  selectedPackId,
  onSelectPack,
  onBuy,
  onBack,
  onConfirm,
}: BuyHudProps) {
  return (
    <div className="buy-hud">
      <div className="buy-panel">
        <header className="buy-hero">
          <h1 className="buy-title">{model.headline}</h1>
          <p className="buy-value">{model.valueProp}</p>
        </header>

        <div className="buy-balances">
          <div className="buy-balance" data-testid="buy-free">
            <span className="buy-balance-icon">
              <FreeInfluenceIcon />
            </span>
            <span className="buy-balance-copy">
              <span className="buy-balance-label">{model.freeLabel}</span>
              <span className="buy-balance-value" data-testid="buy-free-value">
                {model.freeInfluence}
              </span>
            </span>
          </div>
          <div className="buy-balance" data-testid="buy-extra">
            <span className="buy-balance-icon buy-balance-icon--glow">
              <ExtraInfluenceIcon />
            </span>
            <span className="buy-balance-copy">
              <span className="buy-balance-label">{model.extraLabel}</span>
              <span className="buy-balance-value" data-testid="buy-extra-value">
                {model.extraInfluence}
              </span>
            </span>
          </div>
        </div>

        <div className="buy-packs" role="list">
          {model.packs.map((pack) => {
            const artUrl = getAssetUrl(pack.artId);
            const selected = selectedPackId === pack.id;
            return (
              <button
                key={pack.id}
                type="button"
                role="listitem"
                className={
                  selected ? "buy-pack buy-pack--selected" : "buy-pack"
                }
                data-testid={`buy-pack-${pack.id}`}
                aria-pressed={selected}
                onClick={() => onSelectPack(pack.id)}
              >
                {pack.badge ? (
                  <span className="buy-pack-badge">{pack.badge}</span>
                ) : null}
                {artUrl ? (
                  <img
                    className="buy-pack-art"
                    src={artUrl}
                    alt=""
                    draggable={false}
                  />
                ) : (
                  <span className="buy-pack-art buy-pack-art--fallback" />
                )}
                <span className="buy-pack-name">{pack.name}</span>
                <span className="buy-pack-price">{pack.priceLabel}</span>
                <span className="buy-pack-extra">{pack.extraLabel}</span>
              </button>
            );
          })}
        </div>

        <section
          className="buy-breakdown"
          data-testid="buy-breakdown"
          aria-label={model.feeOneLiner}
        >
          <h2 className="buy-breakdown-title">{BUY_COPY.details}</h2>
          <p className="buy-fee-line">{model.feeOneLiner}</p>
          <dl className="buy-breakdown-list">
            <div className="buy-row">
              <dt>{BUY_COPY.youPay}</dt>
              <dd data-testid="buy-you-pay">{model.breakdown.youPay}</dd>
            </div>
            <div className="buy-row">
              <dt>
                {BUY_COPY.prizePool}
                <span className="buy-pct">{model.breakdown.prizePoolPct}</span>
              </dt>
              <dd data-testid="buy-prize-pool">{model.breakdown.prizePool}</dd>
            </div>
            <div className="buy-row">
              <dt>
                {BUY_COPY.studioNet}
                <span className="buy-pct">{model.breakdown.studioNetPct}</span>
              </dt>
              <dd data-testid="buy-studio-net">{model.breakdown.studioNet}</dd>
            </div>
            <div className="buy-row">
              <dt>
                {BUY_COPY.novaBudget}
                <span className="buy-pct">{model.breakdown.novaBudgetPct}</span>
              </dt>
              <dd data-testid="buy-nova-budget">{model.breakdown.novaBudget}</dd>
            </div>
            <div className="buy-row buy-row--receive">
              <dt>{BUY_COPY.youReceive}</dt>
              <dd data-testid="buy-you-receive">{model.breakdown.youReceive}</dd>
            </div>
          </dl>
        </section>

        <div className="buy-actions">
          <button
            type="button"
            className="buy-cta"
            data-testid="buy-cta"
            disabled={!model.ctaEnabled}
            aria-label={model.cta}
            title={model.ctaDisabledReason ?? undefined}
            onClick={onBuy}
          >
            {model.cta}
            <span aria-hidden="true">›</span>
          </button>
          <button
            type="button"
            className="buy-back"
            data-testid="buy-back"
            onClick={onBack}
          >
            {model.back}
          </button>
          {model.confirmLabel ? (
            <button
              type="button"
              className="buy-back"
              data-testid="buy-confirm"
              onClick={onConfirm}
            >
              {model.confirmLabel}
            </button>
          ) : null}
          {model.status ? (
            <p className="buy-status" data-testid="buy-status">
              {model.status}
            </p>
          ) : null}
          {model.ctaDisabledReason ? (
            <p className="buy-status buy-status--warn" data-testid="buy-cap">
              {model.ctaDisabledReason}
            </p>
          ) : null}
          {model.capHint && !model.ctaDisabledReason ? (
            <p className="buy-status buy-status--hint" data-testid="buy-cap-hint">
              {model.capHint}
            </p>
          ) : null}
        </div>

        <footer className="buy-footnotes">
          <p>
            <ShieldIcon className="buy-shield" />
            {model.noGuarantee} {model.feeExpand}
          </p>
          <p>{model.contest}</p>
          <p>{model.affiliation}</p>
          <p>{model.dailyBuyCap}</p>
        </footer>
      </div>
    </div>
  );
}
