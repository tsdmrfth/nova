import {
  BUY_SPLIT_BPS,
  BPS_DENOMINATOR,
  EFFECTIVE_EXTRA_CAP,
  PACK_CATALOG,
  attemptBuy,
  formatUsdc,
  quotePack,
  remainingDailyBuyMicro,
  type MicroUsdc,
  type PackId,
} from "@nova/shared";
import type { DayState } from "../day/dayStore";
import { BUY_COPY, DEFAULT_PACK_ID, PACK_ART_IDS } from "./buyCopy";

export { BUY_COPY, DEFAULT_PACK_ID, PACK_ART_IDS };

/** Checkout amounts always show two decimal places (1.00 / 0.90). */
export function formatCheckoutUsdc(micro: MicroUsdc): string {
  const raw = formatUsdc(micro);
  if (!raw.includes(".")) {
    return `${raw}.00`;
  }
  const [whole, frac = ""] = raw.split(".");
  return `${whole}.${frac.padEnd(2, "0")}`;
}

function splitPercents(): { pool: number; fee: number } {
  return {
    pool: BUY_SPLIT_BPS.prizePool / (BPS_DENOMINATOR / 100),
    fee: BUY_SPLIT_BPS.studioFee / (BPS_DENOMINATOR / 100),
  };
}

export type BuyPackCard = {
  id: PackId;
  name: string;
  artId: string;
  priceLabel: string;
  extraLabel: string;
  badge: string | null;
};

export type BuyBreakdown = {
  youPay: string;
  prizePool: string;
  prizePoolPct: string;
  studioFee: string;
  studioFeePct: string;
  youReceive: string;
};

export type BuyHudModel = {
  headline: string;
  valueProp: string;
  freeLabel: string;
  extraLabel: string;
  freeInfluence: number;
  extraInfluence: number;
  packs: BuyPackCard[];
  selectedPackId: PackId;
  breakdown: BuyBreakdown;
  cta: string;
  ctaEnabled: boolean;
  ctaDisabledReason: string | null;
  back: string;
  feeOneLiner: string;
  feeExpand: string;
  noGuarantee: string;
  contest: string;
  affiliation: string;
  dailyBuyCap: string;
  status: string | null;
  capHint: string | null;
};

export function packCards(): BuyPackCard[] {
  return PACK_CATALOG.map((pack) => ({
    id: pack.id,
    name: pack.name,
    artId: PACK_ART_IDS[pack.id],
    priceLabel: `${formatCheckoutUsdc(pack.priceMicroUsdc)} USDC`,
    extraLabel: `${pack.extraInfluence} Extra`,
    badge: pack.id === "pulse" ? BUY_COPY.mostChosen : null,
  }));
}

export function buildBuyModel(
  state: DayState,
  selectedPackId: PackId = DEFAULT_PACK_ID,
): BuyHudModel {
  const percents = splitPercents();
  const quote = quotePack(selectedPackId);
  const attempt = attemptBuy(selectedPackId, state.spentTodayMicro);
  const remaining = remainingDailyBuyMicro(state.spentTodayMicro);
  const last = state.lastBuy;
  const status =
    last?.ok ? `You received ${last.extraInfluence} Extra Influence.` : null;

  return {
    headline: BUY_COPY.headline,
    valueProp: BUY_COPY.valueProp,
    freeLabel: BUY_COPY.freeLabel,
    extraLabel: BUY_COPY.extraLabel,
    freeInfluence: state.freeInfluence,
    extraInfluence: state.extraInfluence,
    packs: packCards(),
    selectedPackId,
    breakdown: {
      youPay: `${formatCheckoutUsdc(quote.youPay)} USDC`,
      prizePool: `${formatCheckoutUsdc(quote.prizePool)} USDC`,
      prizePoolPct: `${percents.pool}%`,
      studioFee: `${formatCheckoutUsdc(quote.studioFee)} USDC`,
      studioFeePct: `${percents.fee}%`,
      youReceive: `${quote.extraInfluence} Extra Influence`,
    },
    cta: BUY_COPY.cta,
    ctaEnabled: attempt.ok,
    ctaDisabledReason: attempt.ok ? null : BUY_COPY.capExceeded,
    back: BUY_COPY.back,
    feeOneLiner: BUY_COPY.feeOneLiner,
    feeExpand: BUY_COPY.feeExpand,
    noGuarantee: BUY_COPY.noGuarantee,
    contest: BUY_COPY.contest,
    affiliation: BUY_COPY.affiliation,
    dailyBuyCap: BUY_COPY.dailyBuyCap,
    status,
    capHint:
      remaining === 0n || state.extraInfluence >= EFFECTIVE_EXTRA_CAP
        ? BUY_COPY.capHint
        : null,
  };
}
