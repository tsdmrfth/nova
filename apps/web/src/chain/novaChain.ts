import type { ChoiceId } from "@nova/assets";
import { EFFECTIVE_EXTRA_CAP, type MicroUsdc, type PackId } from "@nova/shared";

export const CHOICE_IDS: readonly ChoiceId[] = ["A", "B", "C"];

export function choiceToOption(id: ChoiceId): number {
  return CHOICE_IDS.indexOf(id);
}

export function optionToChoice(option: number): ChoiceId {
  const id = CHOICE_IDS[option];
  if (!id) throw new RangeError(`Unknown option ${option}`);
  return id;
}

/** One wallet's row for one day, as `NovaDemoPool.entries` stores it. */
export type ChainEntry = {
  extraBought: number;
  extraPlaced: number;
  free: number;
  option: ChoiceId | null;
  voted: boolean;
  claimed: boolean;
};

export const EMPTY_ENTRY: ChainEntry = {
  extraBought: 0,
  extraPlaced: 0,
  free: 0,
  option: null,
  voted: false,
  claimed: false,
};

/** The pool's current day plus the connected wallet's row. */
export type ChainDay = {
  dayId: number;
  open: boolean;
  settled: boolean;
  /** Epoch ms, or null when the owner closes the day by settling. */
  closesAt: number | null;
  prize: MicroUsdc;
  rollover: MicroUsdc;
  spentMicro: MicroUsdc;
  entry: ChainEntry;
};

export type OptionTotals = Record<ChoiceId, number>;

/** A settled day as the pool recorded it, with the wallet's share. */
export type ChainDayResult = {
  dayId: number;
  winnerId: ChoiceId;
  pot: MicroUsdc;
  paidBucket: MicroUsdc;
  freeBucket: MicroUsdc;
  rolledOut: MicroUsdc;
  freeTotals: OptionTotals;
  extraTotals: OptionTotals;
  entry: ChainEntry;
  share: { paid: MicroUsdc; free: MicroUsdc; total: MicroUsdc };
};

/** Pool reads and wallet writes. Writes resolve with the confirmed tx hash. */
export type NovaChain = {
  chainName: string;
  explorerUrl: string;
  readDay(account: string | null): Promise<ChainDay>;
  /** Null until that day is settled. */
  readResult(dayId: number, account: string | null): Promise<ChainDayResult | null>;
  buy(account: string, pack: PackId): Promise<string>;
  castVote(account: string, option: ChoiceId, free: number, extra: number): Promise<string>;
  claim(account: string, dayId: number): Promise<string>;
};

/** The day whose results the player can see: today once settled, else yesterday. */
export function resultsDayFor(day: Pick<ChainDay, "dayId" | "open">): number {
  return day.open ? day.dayId - 1 : day.dayId;
}

/**
 * Same floor math as `NovaDemoPool.claimable`, but independent of the claimed flag
 * so a claimed share still shows its amount.
 */
export function shareFor(input: {
  winnerId: ChoiceId;
  paidBucket: MicroUsdc;
  freeBucket: MicroUsdc;
  freeTotals: OptionTotals;
  extraTotals: OptionTotals;
  entry: ChainEntry;
}): { paid: MicroUsdc; free: MicroUsdc; total: MicroUsdc } {
  const { entry, winnerId } = input;
  if (!entry.voted || entry.option !== winnerId) return { paid: 0n, free: 0n, total: 0n };
  const extraTotal = BigInt(input.extraTotals[winnerId]);
  const freeTotal = BigInt(input.freeTotals[winnerId]);
  const extraWeight = BigInt(Math.min(entry.extraPlaced, EFFECTIVE_EXTRA_CAP));
  const paid = extraTotal > 0n ? (input.paidBucket * extraWeight) / extraTotal : 0n;
  const free = freeTotal > 0n ? (input.freeBucket * BigInt(entry.free)) / freeTotal : 0n;
  return { paid, free, total: paid + free };
}
