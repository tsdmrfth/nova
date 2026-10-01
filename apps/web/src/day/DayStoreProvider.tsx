import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ChoiceId } from "@nova/assets";
import type { PackId } from "@nova/shared";
import { DayStoreContext } from "./dayStoreContext";
import {
  buyPack,
  castSelected,
  claimPayout,
  confirmClaim,
  createDayState,
  failClaim,
  selectChoice,
  setExtraSpendAmount,
  setSpendAmount,
  type ClaimSnapshot,
} from "./dayStore";

/** Offline stand-in for onchain confirmation time. */
export const CLAIM_CONFIRM_MS = 1500;

/** QA: `?claim=fail` makes the mock claim fail once it "confirms". */
function claimShouldFail(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return new URLSearchParams(window.location.search).get("claim") === "fail";
}

export function DayStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => createDayState(1));
  // Read once: in-app navigation drops the query string before the claim settles.
  const [failClaims] = useState(claimShouldFail);

  useEffect(() => {
    if (state.claimStatus !== "pending") {
      return;
    }
    const timer = window.setTimeout(() => {
      setState((current) => (failClaims ? failClaim(current) : confirmClaim(current)));
    }, CLAIM_CONFIRM_MS);
    return () => window.clearTimeout(timer);
  }, [state.claimStatus, failClaims]);

  const select = useCallback((id: ChoiceId) => {
    setState((current) => selectChoice(current, id));
  }, []);

  const setSpend = useCallback((amount: number) => {
    setState((current) => setSpendAmount(current, amount));
  }, []);

  const setExtraSpend = useCallback((amount: number) => {
    setState((current) => setExtraSpendAmount(current, amount));
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
    () => ({ state, select, setSpend, setExtraSpend, cast, buy, claim }),
    [state, select, setSpend, setExtraSpend, cast, buy, claim],
  );

  return (
    <DayStoreContext.Provider value={value}>{children}</DayStoreContext.Provider>
  );
}