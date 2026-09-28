import { createContext } from "react";
import type { ChoiceId } from "@nova/assets";
import type { PackId } from "@nova/shared";
import type { ClaimSnapshot, DayState } from "./dayStore";

export type DayStoreValue = {
  state: DayState;
  select(id: ChoiceId): void;
  setSpend(amount: number): void;
  setExtraSpend(amount: number): void;
  cast(): void;
  buy(packId: PackId): void;
  claim(snapshot: ClaimSnapshot): void;
};

export const DayStoreContext = createContext<DayStoreValue | null>(null);