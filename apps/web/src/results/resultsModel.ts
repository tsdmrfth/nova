import type { ChoiceId } from "@nova/assets";
import { formatUsdc, type DayGoal, type MicroUsdc } from "@nova/shared";
import type { ClaimStatus, DayState } from "../day/dayStore";
import { playerFacingIfWins } from "../content/season1";
import { RESULTS_COPY } from "./resultsCopy";
import { settleOffline, type OfflineDaySettle } from "./settleMock";

export { RESULTS_COPY };

export const WINNER_BADGE_ID = "badge_winner";

export type ResultsShareRow = {
  id: "paid" | "free";
  label: string;
};

export type ResultsHudModel = {
  day: number;
  goal: DayGoal;
  canon: string;
  goalLine: string;
  hook: string | null;
  winnerId: ChoiceId;
  winnerTitle: string;
  winnerWorld: string;
  badgeId: string;
  paidShare: MicroUsdc;
  freeShare: MicroUsdc;
  totalShare: MicroUsdc;
  shareRows: ResultsShareRow[];
  miss: string | null;
  rollover: string | null;
  spark: number;
  sparkLabel: string;
  sparkHint: string;
  claimStatus: ClaimStatus;
  claimCta: string;
  claimEnabled: boolean;
  share: string;
  back: string;
  disclaimer: string;
  needCast: string | null;
  voteCta: string;
  lockedVote: boolean;
  correct: boolean;
};

export function formatShareUsdc(micro: MicroUsdc): string {
  return formatUsdc(micro);
}

function shareRows(paid: MicroUsdc, free: MicroUsdc): ResultsShareRow[] {
  const rows: ResultsShareRow[] = [];
  if (paid > 0n) {
    rows.push({
      id: "paid",
      label: RESULTS_COPY.paidPool(formatShareUsdc(paid)),
    });
  }
  if (free > 0n) {
    rows.push({
      id: "free",
      label: RESULTS_COPY.freePool(formatShareUsdc(free)),
    });
  }
  return rows;
}

export function claimLabel(status: ClaimStatus, total: MicroUsdc): string {
  if (status === "claimed") {
    return RESULTS_COPY.claimed;
  }
  if (status === "pending") {
    return RESULTS_COPY.claimPending;
  }
  return RESULTS_COPY.claim(formatShareUsdc(total));
}

export function buildResultsModel(
  state: DayState,
  settled: OfflineDaySettle = settleOffline(state),
): ResultsHudModel {
  const winner =
    state.choices.find((choice) => choice.id === settled.winningOptionId) ??
    state.choices[0];
  const claimed = state.claim;
  const paid = claimed?.paid ?? settled.player.paid;
  const free = claimed?.free ?? settled.player.free;
  const total = claimed?.total ?? settled.player.total;
  const spark = claimed?.spark ?? settled.spark.spark;
  const winnerId = (claimed?.winningOptionId ?? settled.winningOptionId) as ChoiceId;
  const winnerChoice =
    state.choices.find((choice) => choice.id === winnerId) ?? winner;
  const rows = shareRows(paid, free);
  const rolledOver = settled.rolledOver;
  const claimStatus = state.claimStatus;

  return {
    day: state.day,
    goal: state.goal,
    canon: RESULTS_COPY.canonToday(winnerChoice?.title ?? settled.winningOptionId),
    goalLine: RESULTS_COPY.dayGoal(state.goal),
    hook: playerFacingIfWins(winnerChoice?.ifWins),
    winnerId: winnerChoice?.id ?? "B",
    winnerTitle: winnerChoice?.title ?? settled.winningOptionId,
    winnerWorld: winnerChoice?.world ?? "",
    badgeId: WINNER_BADGE_ID,
    paidShare: paid,
    freeShare: free,
    totalShare: total,
    shareRows: rows,
    miss: rolledOver ? null : rows.length === 0 ? RESULTS_COPY.miss : null,
    rollover: rolledOver ? RESULTS_COPY.rollover : null,
    spark,
    sparkLabel: RESULTS_COPY.sparkLabel,
    sparkHint: RESULTS_COPY.sparkHint,
    claimStatus,
    claimCta: claimLabel(claimStatus, total),
    claimEnabled: total > 0n && claimStatus !== "claimed",
    share: RESULTS_COPY.share,
    back: RESULTS_COPY.back,
    disclaimer: RESULTS_COPY.resultsNote,
    needCast: settled.lockedVote ? null : RESULTS_COPY.needCast,
    voteCta: RESULTS_COPY.voteCta,
    lockedVote: settled.lockedVote,
    correct: settled.correct,
  };
}
