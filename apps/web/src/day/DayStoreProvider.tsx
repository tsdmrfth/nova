import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import type { ChoiceId } from "@nova/assets";
import type { PackId } from "@nova/shared";
import { parseSeasonDay } from "../content/season1";
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
  const [params] = useSearchParams();
  // Read once. Later routes keep this round. Advancing the day is P1-07.
  const [state, setState] = useState(() =>
    createDayState(parseSeasonDay(params.get("day"))),
  );

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