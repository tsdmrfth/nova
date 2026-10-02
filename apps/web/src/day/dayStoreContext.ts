import { createContext } from "react";
import type { ChoiceId } from "@nova/assets";
import type { PackId } from "@nova/shared";
import type { ClaimSnapshot, DayState } from "./dayStore";

export type DayStoreValue = {
  state: DayState;
  busy: boolean;
  error: string | null;
  transactionUrl: string | null;
  offline: boolean;
  select(id: ChoiceId): void;
  setSpend(amount: number): void;
  setExtraSpend(amount: number): void;
  cast(): boolean;
  buy(packId: PackId): Promise<void>;
  claim(snapshot: ClaimSnapshot): void;
};

export const DayStoreContext = createContext<DayStoreValue | null>(null);