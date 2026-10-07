import { createContext } from "react";
import type { ChoiceId } from "@nova/assets";
import type { PackId } from "@nova/shared";
import type { ChainDayResult } from "../chain/novaChain";
import type { ClaimStatus, DayState } from "./dayStore";

export type DayStoreValue = {
  state: DayState;
  /** False when this build has no pool address. */
  available: boolean;
  /** The pool's current day has been read for this wallet. */
  ready: boolean;
  busy: boolean;
  error: string | null;
  /** Explorer link for the last confirmed vote or buy. */
  transactionUrl: string | null;
  /** The latest settled day for this wallet, if any. */
  result: ChainDayResult | null;
  claimStatus: ClaimStatus;
  claimUrl: string | null;
  select(id: ChoiceId): void;
  setSpend(amount: number): void;
  setExtraSpend(amount: number): void;
  cast(): Promise<boolean>;
  buy(packId: PackId): Promise<boolean>;
  claim(): Promise<void>;
};

export const DayStoreContext = createContext<DayStoreValue | null>(null);
