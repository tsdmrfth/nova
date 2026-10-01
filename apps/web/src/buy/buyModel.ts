import {
  EFFECTIVE_EXTRA_CAP,
  PACK_CATALOG,
  attemptBuy,
  buySplitPercents,
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

function splitPercents() {
  return buySplitPercents();
}

export type BuyPackCard = {
  id: PackId;
  name: string;
  /** Big tile number, e.g. "5". */
  price: string;
  priceLabel: string;
  extraLabel: string;
  badge: string | null;
};

export type BuyBreakdown = {
  youPay: string;
  prizePool: string;
  prizePoolPct: string;
  studioNet: string;
  studioNetPct: string;
  novaBudget: string;
  novaBudgetPct: string;
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
  /** "WHERE 5.00 USDC GOES". */
  splitTitle: string;
  split: { prizePool: number; studioNet: number; novaBudget: number };
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
    price: formatUsdc(pack.priceMicroUsdc),
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
      prizePoolPct: `${percents.prizePool}%`,
      studioNet: `${formatCheckoutUsdc(quote.studioNet)} USDC`,
      studioNetPct: `${percents.studioNet}%`,
      novaBudget: `${formatCheckoutUsdc(quote.novaBudget)} USDC`,
      novaBudgetPct: `${percents.novaBudget}%`,
      youReceive: `${quote.extraInfluence} Extra Influence`,
    },
    splitTitle: BUY_COPY.splitTitle(formatCheckoutUsdc(quote.youPay)),
    split: {
      prizePool: percents.prizePool,
      studioNet: percents.studioNet,
      novaBudget: percents.novaBudget,
    },
    cta: BUY_COPY.confirmCta(formatCheckoutUsdc(quote.youPay)),
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
