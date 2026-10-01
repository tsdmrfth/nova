import type { ChoiceId } from "@nova/assets";
import { BPS_DENOMINATOR, DAY_SPLIT_BPS, type DayGoal, type MicroUsdc } from "@nova/shared";
import { formatCheckoutUsdc } from "../buy/buyModel";
import type { ClaimStatus, DayState } from "../day/dayStore";
import { padDay } from "../hud/homeHudModel";
import { RESULTS_COPY } from "./resultsCopy";
import { settleOffline, type OfflineDaySettle } from "./settleMock";

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

function variantFor(settled: OfflineDaySettle): ResultsVariant {
  if (!settled.lockedVote) {
    return "needCast";
  }
  if (settled.correct) {
    return "matched";
  }
  return settled.rolledOver ? "rollover" : "miss";
}

const HEADINGS: Record<ResultsVariant, { title: string; sub: string }> = {
  matched: { title: RESULTS_COPY.matchedTitle, sub: RESULTS_COPY.matchedSub },
  miss: { title: RESULTS_COPY.missTitle, sub: RESULTS_COPY.missSub },
  rollover: { title: RESULTS_COPY.missTitle, sub: RESULTS_COPY.rollover },
  needCast: { title: RESULTS_COPY.needCastTitle, sub: RESULTS_COPY.needCast },
};

export function buildResultsModel(
  state: DayState,
  settled: OfflineDaySettle = settleOffline(state),
): ResultsHudModel {
  const claimed = state.claim;
  const paid = claimed?.paid ?? settled.player.paid;
  const free = claimed?.free ?? settled.player.free;
  const total = claimed?.total ?? settled.player.total;
  const winnerId = (claimed?.winningOptionId ?? settled.winningOptionId) as ChoiceId;
  const winner =
    state.choices.find((choice) => choice.id === winnerId) ?? state.choices[0];
  const variant = variantFor(settled);
  const pick = state.casts.at(-1)?.optionId ?? null;
  const next = padDay(state.day + 1);
  const claimStatus = state.claimStatus;

  return {
    day: state.day,
    dayLabel: `DAY ${padDay(state.day)}`,
    goal: state.goal,
    variant,
    ...HEADINGS[variant],
    winnerId: winner.id,
    winnerTitle: winner.title,
    pickId: pick,
    dayPool: usdc(settled.pool.prizePool),
    paidLaneLabel: RESULTS_COPY.paidLane(pct(DAY_SPLIT_BPS.paidWinners)),
    paidLane: usdc(settled.pool.paidWinnerBucket),
    freeLaneLabel: RESULTS_COPY.freeLane(pct(DAY_SPLIT_BPS.freeWinners)),
    freeLane: usdc(settled.pool.freeWinnerBucket),
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
    lockedVote: settled.lockedVote,
    correct: settled.correct,
  };
}
