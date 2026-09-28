import type { ChoiceId } from "@nova/assets";
import { EFFECTIVE_EXTRA_CAP } from "@nova/shared";
import { BUY_COPY } from "../buy/buyCopy";
import { CONFIRMATION_COPY } from "../confirmation/confirmationCopy";
import { canCast, formatLocalStamp, type DayState } from "../day/dayStore";

export type HudChoice = {
  id: ChoiceId;
  label: string;
  title: string;
  body: string;
  artId: string;
};

export type HudModel = {
  day: number;
  goal: DayState["goal"];
  freeInfluence: number;
  extraInfluence: number;
  spendAmount: number;
  extraSpendAmount: number;
  spendCapHint: string;
  usdcLabel: string;
  rankTitle: string;
  rankXp: { current: number; next: number };
  heroTitle: string;
  heroSub: string;
  scene: string;
  freeHint: string;
  dayHint: string;
  choices: HudChoice[];
  status: DayState["status"];
  castEnabled: boolean;
  castMessage: string;
  castDetail: string;
  buyEntry: string | null;
  buyEntryToBuy: boolean;
  confirmLabel: string | null;
  disclaimer: string;
};

export type HudCallbacks = {
  onSelect(id: ChoiceId): void;
  onSpend(amount: number): void;
  onExtraSpend(amount: number): void;
  onCast(): void;
  onBuyFreePlus(): void;
  onBuyExtraPlus(): void;
  onUsdcChip(): void;
};

const RANK_CHROME = {
  usdcLabel: "USDC",
  rankTitle: "Architect Apprentice",
  rankXp: { current: 1250, next: 2000 },
  disclaimer:
    "Influence is non-binding but impactful. Outcomes shape the world for all citizens.",
} as const;

export function voteBuyEntry(state: DayState): {
  buyEntry: string | null;
  buyEntryToBuy: boolean;
} {
  if (state.freeInfluence === 0 && state.extraInfluence === 0) {
    return { buyEntry: BUY_COPY.comeBack, buyEntryToBuy: true };
  }
  if (state.extraInfluence === 0) {
    return { buyEntry: BUY_COPY.needMore, buyEntryToBuy: true };
  }
  if (state.extraInfluence >= EFFECTIVE_EXTRA_CAP) {
    return { buyEntry: BUY_COPY.capHint, buyEntryToBuy: false };
  }
  return { buyEntry: null, buyEntryToBuy: false };
}

export function buildHudModel(
  state: DayState,
  artByChoice: Record<ChoiceId, string>,
): HudModel {
  const castEnabled = canCast(state);
  const { buyEntry, buyEntryToBuy } = voteBuyEntry(state);
  return {
    day: state.day,
    goal: state.goal,
    freeInfluence: state.freeInfluence,
    extraInfluence: state.extraInfluence,
    spendAmount: state.spendAmount,
    extraSpendAmount: state.extraSpendAmount,
    spendCapHint: BUY_COPY.capHint,
    ...RANK_CHROME,
    heroTitle: state.roundTitle,
    heroSub: `Day goal ${state.goal}`,
    scene: state.scene,
    freeHint: state.freeHint,
    dayHint: state.dayHint,
    choices: state.choices.map((choice) => ({
      id: choice.id,
      label: choice.world,
      title: choice.title,
      body: choice.caption,
      artId: artByChoice[choice.id],
    })),
    status: state.status,
    castEnabled,
    castMessage: state.status === "cast" ? "Influence cast" : "Cast Influence",
    castDetail:
      state.status === "cast"
        ? `Locked until ${formatLocalStamp(state.schedule.voteCloseAt)}. Results publish around ${formatLocalStamp(state.schedule.publishAt)}.`
        : state.dayHint,
    buyEntry,
    buyEntryToBuy,
    confirmLabel:
      state.status === "cast" ? CONFIRMATION_COPY.reviewCta : null,
    disclaimer: RANK_CHROME.disclaimer,
  };
}
