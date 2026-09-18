import { createContext } from "react";
import type { ChoiceId } from "@nova/assets";
import type { DayState } from "./dayStore";

export type DayStoreValue = {
  state: DayState;
  select(id: ChoiceId): void;
  setSpend(amount: number): void;
  cast(): void;
};

export const DayStoreContext = createContext<DayStoreValue | null>(null);
