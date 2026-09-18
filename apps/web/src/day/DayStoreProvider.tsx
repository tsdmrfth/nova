import { useCallback, useMemo, useState, type ReactNode } from "react";
import type { ChoiceId } from "@nova/assets";
import { DayStoreContext } from "./dayStoreContext";
import {
  castSelected,
  createDayState,
  selectChoice,
  setSpendAmount,
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

  const value = useMemo(
    () => ({ state, select, setSpend, cast }),
    [state, select, setSpend, cast],
  );

  return (
    <DayStoreContext.Provider value={value}>{children}</DayStoreContext.Provider>
  );
}
