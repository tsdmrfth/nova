import { useCallback, useMemo, useState, type ReactNode } from "react";
import type { ChoiceId } from "@nova/assets";
import type { PackId } from "@nova/shared";
import { DayStoreContext } from "./dayStoreContext";
import {
  buyPack,
  castSelected,
  claimPayout,
  createDayState,
  selectChoice,
  setSpendAmount,
  type ClaimSnapshot,
} from "./dayStore";

export function DayStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => createDayState(1));

  const select = useCallback((id: ChoiceId) => {
    setState((current) => selectChoice(current, id));
  }, []);

  const setSpend = useCallback((amount: number) => {
    setState((current) => setSpendAmount(current, amount));
  }, []);

  const cast = useCallback(() => {
    setState((current) => castSelected(current));
  }, []);

  const buy = useCallback((packId: PackId) => {
    setState((current) => buyPack(current, packId));
  }, []);

  const claim = useCallback((snapshot: ClaimSnapshot) => {
    setState((current) => claimPayout(current, snapshot));
  }, []);

  const value = useMemo(
    () => ({ state, select, setSpend, cast, buy, claim }),
    [state, select, setSpend, cast, buy, claim],
  );

  return (
    <DayStoreContext.Provider value={value}>{children}</DayStoreContext.Provider>
  );
}