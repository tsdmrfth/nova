import type { ChoiceId } from "@nova/assets";
import {
  EFFECTIVE_EXTRA_CAP,
  FREE_DAILY_GRANT,
  DAY_SPLIT_BPS,
  attemptBuy,
  dayGoalFor,
  pickWinningOption,
  quotePack,
  splitAmountByBps,
  type MicroUsdc,
  type PackId,
} from "@nova/shared";
import {
  CHOICE_IDS,
  EMPTY_ENTRY,
  shareFor,
  type ChainDay,
  type ChainDayResult,
  type ChainEntry,
  type NovaChain,
  type OptionTotals,
} from "../chain/novaChain";

type FakeDay = {
  prize: MicroUsdc;
  rollover: MicroUsdc;
  settled: boolean;
  closesAt: number | null;
  paidBucket: MicroUsdc;
  freeBucket: MicroUsdc;
  rolledOut: MicroUsdc;
  winner: ChoiceId;
  free: OptionTotals;
  extra: OptionTotals;
};

const zeroTotals = (): OptionTotals => ({ A: 0, B: 0, C: 0 });

/**
 * In-memory stand-in for `NovaPool`, for UI tests only. Same rules:
 * daily cap, one vote per wallet per day, W* from Free tallies, floor pro-rata claims.
 */
export class FakeNovaChain implements NovaChain {
  chainName = "Arc Testnet";
  explorerUrl = "https://explorer.test";
  dayId = 1;
  open = true;
  /** Rejects the next write with this message, once. */
  failNext: string | null = null;
  /** Holds every write until `release()` when true. */
  hold = false;
  /** Holds `readDay` until `release()` when true. */
  holdReads = false;
  private waiting: Array<() => void> = [];
  private readWaiting: Array<() => void> = [];
  private txCount = 0;
  private days = new Map<number, FakeDay>();
  private entries = new Map<string, ChainEntry>();
  private spent = new Map<string, MicroUsdc>();

  constructor() {
    this.days.set(1, this.blankDay(0n, null));
  }

  private blankDay(rollover: MicroUsdc, closesAt: number | null): FakeDay {
    return {
      prize: 0n,
      rollover,
      settled: false,
      closesAt,
      paidBucket: 0n,
      freeBucket: 0n,
      rolledOut: 0n,
      winner: "A",
      free: zeroTotals(),
      extra: zeroTotals(),
    };
  }

  private key(day: number, account: string) {
    return `${day}:${account.toLowerCase()}`;
  }

  private day(id = this.dayId): FakeDay {
    const day = this.days.get(id);
    if (!day) throw new Error(`No day ${id}`);
    return day;
  }

  private entry(day: number, account: string): ChainEntry {
    return this.entries.get(this.key(day, account)) ?? EMPTY_ENTRY;
  }

  private async write(apply: () => void): Promise<string> {
    if (this.hold) await new Promise<void>((resolve) => this.waiting.push(resolve));
    if (this.failNext) {
      const message = this.failNext;
      this.failNext = null;
      throw new Error(message);
    }
    apply();
    this.txCount += 1;
    return `0x${this.txCount.toString(16).padStart(64, "0")}`;
  }

  release() {
    this.hold = false;
    this.holdReads = false;
    const waiting = this.waiting;
    this.waiting = [];
    waiting.forEach((resolve) => resolve());
    const reads = this.readWaiting;
    this.readWaiting = [];
    reads.forEach((resolve) => resolve());
  }

  private placeExtra(account: string, entry: ChainEntry, extra: number): ChainEntry {
    if (extra === 0 || !entry.option) return entry;
    const before = entry.extraPlaced;
    const after = before + extra;
    const day = this.day();
    day.extra[entry.option] += Math.min(after, EFFECTIVE_EXTRA_CAP) - Math.min(before, EFFECTIVE_EXTRA_CAP);
    const next = { ...entry, extraPlaced: after };
    this.entries.set(this.key(this.dayId, account), next);
    return next;
  }

  private requireOpen() {
    const closesAt = this.day().closesAt;
    if (!this.open || (closesAt !== null && Date.now() >= closesAt)) {
      throw new Error("Voting has closed for today.");
    }
  }

  async readDay(account: string | null): Promise<ChainDay> {
    if (this.holdReads) await new Promise<void>((resolve) => this.readWaiting.push(resolve));
    const day = this.day();
    return {
      dayId: this.dayId,
      open: this.open,
      settled: day.settled,
      closesAt: day.closesAt,
      prize: day.prize,
      rollover: day.rollover,
      spentMicro: account ? (this.spent.get(this.key(this.dayId, account)) ?? 0n) : 0n,
      entry: account ? this.entry(this.dayId, account) : EMPTY_ENTRY,
    };
  }

  async readWinners(throughDay: number) {
    const winners = [];
    for (let day = 1; day <= throughDay; day += 1) {
      const row = this.days.get(day);
      if (row?.settled) winners.push({ day, winner: row.winner });
    }
    return winners;
  }

  async readResult(dayId: number, account: string | null): Promise<ChainDayResult | null> {
    const day = this.days.get(dayId);
    if (!day?.settled) return null;
    const entry = account ? this.entry(dayId, account) : EMPTY_ENTRY;
    const input = {
      winnerId: day.winner,
      paidBucket: day.paidBucket,
      freeBucket: day.freeBucket,
      freeTotals: { ...day.free },
      extraTotals: { ...day.extra },
      entry,
    };
    return {
      dayId,
      pot: day.paidBucket + day.freeBucket,
      rolledOut: day.rolledOut,
      ...input,
      share: shareFor(input),
    };
  }

  buy(account: string, pack: PackId): Promise<string> {
    return this.write(() => {
      this.requireOpen();
      const key = this.key(this.dayId, account);
      const attempt = attemptBuy(pack, this.spent.get(key) ?? 0n);
      if (!attempt.ok) throw new Error("That pack would pass today's 10 USDC limit.");
      const entry = { ...this.entry(this.dayId, account) };
      if (entry.voted) throw new Error("Purchases close once you vote.");
      this.spent.set(key, attempt.spentAfter);
      this.day().prize += quotePack(pack).prizePool;
      entry.extraBought += attempt.extraInfluence;
      this.entries.set(key, entry);
    });
  }

  castVote(account: string, option: ChoiceId, free: number, extra: number): Promise<string> {
    return this.write(() => {
      this.requireOpen();
      const entry = this.entry(this.dayId, account);
      if (entry.voted) throw new Error("This wallet has already voted today.");
      if (free > FREE_DAILY_GRANT) throw new Error("You only have 10 Free Influence today.");
      if (extra > entry.extraBought) throw new Error("You can't place more Extra than you bought today.");
      if (free + extra === 0) throw new Error("Place at least 1 Influence.");
      const next = { ...entry, voted: true, option, free };
      this.entries.set(this.key(this.dayId, account), next);
      this.day().free[option] += free;
      this.placeExtra(account, next, extra);
    });
  }

  claim(account: string, dayId: number): Promise<string> {
    return this.write(() => {
      const key = this.key(dayId, account);
      const entry = this.entry(dayId, account);
      if (entry.claimed) throw new Error("This payout was already claimed.");
      const day = this.days.get(dayId);
      if (!day?.settled) throw new Error("There is nothing to claim for this day.");
      const share = shareFor({
        winnerId: day.winner,
        paidBucket: day.paidBucket,
        freeBucket: day.freeBucket,
        freeTotals: day.free,
        extraTotals: day.extra,
        entry,
      });
      if (share.total === 0n) throw new Error("There is nothing to claim for this day.");
      this.entries.set(key, { ...entry, claimed: true });
    });
  }

  /** Operator `settleDay`. */
  settle() {
    const day = this.day();
    const pot = day.prize + day.rollover;
    const { paidWinnerBucket, freeWinnerBucket } = splitAmountByBps(pot, DAY_SPLIT_BPS);
    const winner = pickWinningOption({
      goal: dayGoalFor(this.dayId),
      optionIds: CHOICE_IDS,
      casts: CHOICE_IDS.map((optionId) => ({ optionId, free: day.free[optionId] })),
    }) as ChoiceId;
    day.paidBucket = paidWinnerBucket;
    day.freeBucket = freeWinnerBucket;
    day.winner = winner;
    day.rolledOut =
      (day.extra[winner] === 0 ? paidWinnerBucket : 0n) + (day.free[winner] === 0 ? freeWinnerBucket : 0n);
    day.settled = true;
    this.open = false;
  }

  /** Operator `openNextDay`. */
  openNextDay(closesAt: number | null = null) {
    const carry = this.day().rolledOut;
    this.dayId += 1;
    this.open = true;
    this.days.set(this.dayId, this.blankDay(carry, closesAt));
  }

  setClose(closesAt: number | null) {
    this.day().closesAt = closesAt;
  }

  /** Other players, written straight into state (no tx). */
  async seed(account: string, input: { packs?: PackId[]; option: ChoiceId; free: number; extra?: number }) {
    for (const pack of input.packs ?? []) await this.buy(account, pack);
    await this.castVote(account, input.option, input.free, input.extra ?? 0);
  }
}
