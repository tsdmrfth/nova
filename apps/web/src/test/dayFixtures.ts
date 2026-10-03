import type { ChoiceId } from "@nova/assets";
import { EMPTY_ENTRY, type ChainDay, type ChainEntry } from "../chain/novaChain";
import { EMPTY_DAY_UI, dayStateFromChain, type DayState, type DayUi } from "../day/dayStore";

export const FIXTURE_ACCOUNT = "0xF2FDeE747478A34deaf79811A4f87581dc01bBBD";
export const FIXTURE_NOW = new Date("2026-09-18T12:00:00").getTime();

export function chainDay(
  overrides: Partial<Omit<ChainDay, "entry">> & { entry?: Partial<ChainEntry> } = {},
): ChainDay {
  const { entry, ...rest } = overrides;
  return {
    dayId: 1,
    open: true,
    settled: false,
    closesAt: null,
    prize: 0n,
    rollover: 0n,
    spentMicro: 0n,
    ...rest,
    entry: { ...EMPTY_ENTRY, ...entry },
  };
}

/** A pool day as the store sees it, with optional local picks on top. */
export function dayState(
  overrides: Parameters<typeof chainDay>[0] = {},
  ui: Partial<DayUi> = {},
): DayState {
  return dayStateFromChain(chainDay(overrides), { ...EMPTY_DAY_UI, ...ui }, FIXTURE_ACCOUNT, FIXTURE_NOW);
}

/** The wallet's vote is onchain. */
export function votedState(option: ChoiceId, free: number, extra = 0, extraBought = extra): DayState {
  return dayState({ entry: { voted: true, option, free, extraPlaced: extra, extraBought } });
}
