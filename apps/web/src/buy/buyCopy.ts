import {
  NOVA_BUDGET_LABEL,
  PLATFORM_FEE_LABEL,
  buySplitPercents,
} from "@nova/shared";

const percents = buySplitPercents();

/** Locked EN copy for Extra Influence checkout (BUY-INFLUENCE-UX / Hukuk). */
export const BUY_COPY = {
  backLabel: "Extra Influence",
  headline: "Add Extra Influence",
  sub: "Optional. Paid in USDC on Arc.",
  valueProp:
    "Extra Influence increases your share of today's paid prize pool if you're correct. It does not make your pick more likely to win.",
  freeLabel: "Free Influence",
  extraLabel: "Extra Influence",
  mostChosen: "Most chosen",
  details: "Details",
  youPay: "You pay",
  prizePool: "Prize pool",
  studioNet: PLATFORM_FEE_LABEL.charAt(0).toUpperCase() + PLATFORM_FEE_LABEL.slice(1),
  novaBudget: "Nova operating budget",
  youReceive: "You receive",
  extraUnit: "Extra Influence",
  splitTitle: (amount: string) => `Where ${amount} USDC goes`,
  confirmCta: (amount: string) => `Confirm buy · ${amount} USDC`,
  back: "Back to vote",
  feeOneLiner: `${percents.prizePool}% prize pool · ${percents.studioNet}% ${PLATFORM_FEE_LABEL} · ${percents.novaBudget}% ${NOVA_BUDGET_LABEL}`,
  feeExpand: `${percents.prizePool}% of what you pay goes to today's prize pool; ${percents.studioNet}% is the ${PLATFORM_FEE_LABEL}; ${percents.novaBudget}% is the ${NOVA_BUDGET_LABEL}.`,
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

export const DEFAULT_PACK_ID = "pulse" as const;
