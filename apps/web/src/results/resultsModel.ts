import type { ChoiceId } from "@nova/assets";
import { BPS_DENOMINATOR, DAY_SPLIT_BPS, type DayGoal, type MicroUsdc } from "@nova/shared";
import { formatCheckoutUsdc } from "../buy/buyModel";
import type { ChainDayResult } from "../chain/novaChain";
import { getSeasonDay } from "../content/season1";
import type { ClaimStatus } from "../day/dayStore";
import { padDay } from "../hud/homeHudModel";
import { RESULTS_COPY } from "./resultsCopy";

export { RESULTS_COPY };

/** 08 matched · 09 miss (+ rollover / needCast variants, UI-KIT-V2 guardrail 4). */
export type ResultsVariant = "matched" | "miss" | "rollover" | "needCast";

export type ResultsHudModel = {
  day: number;
  dayLabel: string;
  goal: DayGoal;
  variant: ResultsVariant;
  title: string;
  sub: string;
  winnerId: ChoiceId;
  winnerTitle: string;
  pickId: ChoiceId | null;
  dayPool: string;
  paidLaneLabel: string;
  paidLane: string;
  freeLaneLabel: string;
  freeLane: string;
  paidShare: MicroUsdc;
  freeShare: MicroUsdc;
  totalShare: MicroUsdc;
  yourExtra: string;
  yourFree: string;
  claimable: string;
  teaseKicker: string;
  teaseTitle: string;
  claimStatus: ClaimStatus;
  claimCta: string;
  claimEnabled: boolean;
  lockedVote: boolean;
  correct: boolean;
};

export function formatShareUsdc(micro: MicroUsdc): string {
  return formatCheckoutUsdc(micro);
}

function usdc(micro: MicroUsdc): string {
  return `${formatShareUsdc(micro)} USDC`;
}

function pct(bps: number): number {
  return Math.round((bps / BPS_DENOMINATOR) * 100);
}

/** Facts about one settled day for the connected wallet. */
export type ResultsFacts = {
  lockedVote: boolean;
  correct: boolean;
  /** The whole pot rolled into the next day (no winner in either lane). */
  rolledOver: boolean;
};

export function resultsFacts(result: ChainDayResult): ResultsFacts {
  const lockedVote = result.entry.voted;
  return {
    lockedVote,
    correct: lockedVote && result.entry.option === result.winnerId,
    rolledOver: result.pot > 0n && result.rolledOut === result.pot,
  };
}

function variantFor(facts: ResultsFacts): ResultsVariant {
  if (!facts.lockedVote) {
    return "needCast";
  }
  if (facts.correct) {
    return "matched";
  }
  return facts.rolledOver ? "rollover" : "miss";
}

const HEADINGS: Record<ResultsVariant, { title: string; sub: string }> = {
  matched: { title: RESULTS_COPY.matchedTitle, sub: RESULTS_COPY.matchedSub },
  miss: { title: RESULTS_COPY.missTitle, sub: RESULTS_COPY.missSub },
  rollover: { title: RESULTS_COPY.missTitle, sub: RESULTS_COPY.rollover },
  needCast: { title: RESULTS_COPY.needCastTitle, sub: RESULTS_COPY.needCast },
};

export function buildResultsModel(
  result: ChainDayResult,
  claimStatus: ClaimStatus,
): ResultsHudModel {
  const copy = getSeasonDay(result.dayId);
  const facts = resultsFacts(result);
  const { paid, free, total } = result.share;
  const winner =
    copy.choices.find((choice) => choice.id === result.winnerId) ?? copy.choices[0];
  const variant = variantFor(facts);
  const next = padDay(result.dayId + 1);

  return {
    day: result.dayId,
    dayLabel: `DAY ${padDay(result.dayId)}`,
    goal: copy.goal,
    variant,
    ...HEADINGS[variant],
    winnerId: winner.id,
    winnerTitle: winner.title,
    pickId: result.entry.option,
    dayPool: usdc(result.pot),
    paidLaneLabel: RESULTS_COPY.paidLane(pct(DAY_SPLIT_BPS.paidWinners)),
    paidLane: usdc(result.paidBucket),
    freeLaneLabel: RESULTS_COPY.freeLane(pct(DAY_SPLIT_BPS.freeWinners)),
    freeLane: usdc(result.freeBucket),
    paidShare: paid,
    freeShare: free,
    totalShare: total,
    yourExtra: usdc(paid),
    yourFree: usdc(free),
    claimable: usdc(total),
    teaseKicker: RESULTS_COPY.teaseKicker(next),
    teaseTitle: RESULTS_COPY.tease(next),
    claimStatus,
    claimCta:
      claimStatus === "claimed"
        ? RESULTS_COPY.claimed
        : RESULTS_COPY.claim(formatShareUsdc(total)),
    claimEnabled: total > 0n && claimStatus !== "claimed" && claimStatus !== "pending",
    lockedVote: facts.lockedVote,
    correct: facts.correct,
  };
}
