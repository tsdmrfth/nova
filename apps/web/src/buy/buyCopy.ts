import {
  BPS_DENOMINATOR,
  BUY_SPLIT_BPS,
  PLATFORM_FEE_LABEL,
} from "@nova/shared";

const poolPct = BUY_SPLIT_BPS.prizePool / (BPS_DENOMINATOR / 100);
const feePct = BUY_SPLIT_BPS.studioFee / (BPS_DENOMINATOR / 100);

/** Locked EN copy for Extra Influence checkout (BUY-INFLUENCE-UX / Hukuk). */
export const BUY_COPY = {
  headline: "Extra Influence",
  valueProp:
    "Extra Influence increases your share of today's paid prize pool if you're correct. It does not make your pick more likely to win.",
  freeLabel: "Free Influence",
  extraLabel: "Extra Influence",
  mostChosen: "Most chosen",
  details: "Details",
  youPay: "You pay",
  prizePool: "Prize pool",
  studioFee: "Studio fee",
  youReceive: "You receive",
  extraUnit: "Extra Influence",
  cta: "Buy with USDC",
  back: "Back to vote",
  feeOneLiner: `${poolPct}% prize pool · ${feePct}% ${PLATFORM_FEE_LABEL}`,
  feeExpand: `${poolPct}% of what you pay goes to today's prize pool; ${feePct}% is the ${PLATFORM_FEE_LABEL}.`,
  noGuarantee: "No guaranteed return.",
  contest:
    "Not financial advice. Contest / social prediction rules apply where available. Soft launch geo may exclude some regions.",
  affiliation:
    "Third-party game on Arc. Not affiliated with Circle's Architects program.",
  capHint: "Daily Extra weight cap applies (max 100).",
  dailyBuyCap: "Daily Extra purchases are capped at 10 USDC.",
  capExceeded: "Daily Extra buy cap applies.",
  needMore: "Need more Extra Influence?",
  comeBack: "Come back for today's free Influence",
} as const;

export const PACK_ART_IDS = {
  spark: "pack_spark",
  pulse: "pack_pulse",
} as const;

export const DEFAULT_PACK_ID = "pulse" as const;
