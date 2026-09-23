import {
  buildDayPrizePool,
  payoutsByWallet,
  pickWinningOption,
  settleDay,
  sparkForDay,
  type Cast,
  type DayGoal,
  type DayPrizePool,
  type MicroUsdc,
  type PackId,
  type SettlementResult,
  type SparkAward,
  type WalletPayout,
} from "@nova/shared";
import { LOCAL_PLAYER_ID, type DayState } from "../day/dayStore";
import { CROWD_PACKS, crowdCasts } from "./crowdMock";

export type OfflineDaySettle = {
  winningOptionId: string;
  goal: DayGoal;
  pool: DayPrizePool;
  settlement: SettlementResult;
  player: WalletPayout;
  spark: SparkAward;
  lockedVote: boolean;
  correct: boolean;
  rolledOver: boolean;
};

export function playerCasts(state: DayState): Cast[] {
  return state.casts.map((cast) => ({
    walletId: cast.walletId,
    optionId: cast.optionId,
    extra: cast.extra,
    free: cast.free,
  }));
}

export function packsForDay(state: DayState): PackId[] {
  return [...CROWD_PACKS, ...state.packsBought];
}

export function emptyPlayerPayout(walletId = LOCAL_PLAYER_ID): WalletPayout {
  return { walletId, paid: 0n, free: 0n, total: 0n };
}

/**
 * Offline day close: crowd + local player, math only via `@nova/shared`.
 */
export function settleOffline(state: DayState): OfflineDaySettle {
  const casts = [...crowdCasts(), ...playerCasts(state)];
  const optionIds = state.choices.map((choice) => choice.id);
  const winningOptionId = pickWinningOption({
    goal: state.goal,
    optionIds,
    casts,
  });
  const pool = buildDayPrizePool({ packs: packsForDay(state) });
  const settlement = settleDay({
    prizePool: pool.prizePool,
    winningOptionId,
    casts,
  });
  const player =
    payoutsByWallet(settlement).find((row) => row.walletId === LOCAL_PLAYER_ID) ??
    emptyPlayerPayout();
  const lockedVote = state.casts.length > 0;
  const correct =
    lockedVote && state.casts.some((cast) => cast.optionId === winningOptionId);
  const spark = sparkForDay({
    lockedVote,
    correct,
    sevenDayStreak: false,
  });
  return {
    winningOptionId,
    goal: state.goal,
    pool,
    settlement,
    player,
    spark,
    lockedVote,
    correct,
    rolledOver: settlement.nextDayRollover === pool.prizePool && pool.prizePool > 0n,
  };
}

export function snapshotFromSettle(result: OfflineDaySettle): {
  paid: MicroUsdc;
  free: MicroUsdc;
  total: MicroUsdc;
  spark: number;
  winningOptionId: string;
} {
  return {
    paid: result.player.paid,
    free: result.player.free,
    total: result.player.total,
    spark: result.spark.spark,
    winningOptionId: result.winningOptionId,
  };
}
