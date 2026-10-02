import { quotePack } from "@nova/shared";
import { offlineWalletPreview } from "../wallet/walletMode";
import { readInjectedProvider, readChainId, sendExtraInfluenceBuy, walletErrorMessage } from "../demo/arcWallet";
import { readDemoConfig, explorerTxUrl } from "../demo/demoConfig";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
  const offline = offlineWalletPreview();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionUrl, setTransactionUrl] = useState<string | null>(null);
  const pending = useRef(false);
  const [state, setState] = useState(() => createDayState(1));
  // Read once: in-app navigation drops the query string before the claim settles.
  const [failClaims] = useState(claimShouldFail);

  useEffect(() => {
    if (!offline || state.claimStatus !== "pending") {
      return;
    }
    const timer = window.setTimeout(() => {
      setState((current) => (failClaims ? failClaim(current) : confirmClaim(current)));
    }, CLAIM_CONFIRM_MS);
    return () => window.clearTimeout(timer);
  }, [state.claimStatus, failClaims, offline]);

  useEffect(() => {
    if (offline) return;
    const provider = readInjectedProvider();
    const reset = () => { setState(createDayState(1)); setError(null); setTransactionUrl(null); };
    provider?.on?.("accountsChanged", reset);
    provider?.on?.("chainChanged", reset);
    provider?.on?.("disconnect", reset);
    return () => {
      provider?.removeListener?.("accountsChanged", reset);
      provider?.removeListener?.("chainChanged", reset);
      provider?.removeListener?.("disconnect", reset);
    };
  }, [offline]);

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
    if (!offline) {
      setError("Voting is not available yet.");
      return false;
    }
    setState((current) => castSelected(current));
    return true;
  }, [offline]);

  const buy = useCallback(async (packId: PackId) => {
    if (offline) { setState((current) => buyPack(current, packId)); return; }
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    setTransactionUrl(null);
    try {
      const provider = readInjectedProvider();
      const config = readDemoConfig();
      if (!provider) throw new Error("Connect your browser wallet before buying.");
      if (!config.poolAddress) throw new Error(`Purchases on ${config.chainName} are not available yet. The purchase contract has not been configured.`);
      const accounts = await provider.request({ method: "eth_accounts" });
      if (!Array.isArray(accounts) || typeof accounts[0] !== "string") throw new Error("Connect your wallet before buying.");
      const account = accounts[0];
      const receipt = await sendExtraInfluenceBuy({ provider, config, from: account, pack: packId, price: quotePack(packId).youPay });
      setTransactionUrl(explorerTxUrl(config.explorerUrl, receipt.buyHash));
      const latest = await provider.request({ method: "eth_accounts" });
      if (await readChainId(provider) !== config.chainId || !Array.isArray(latest) || latest[0]?.toLowerCase() !== account.toLowerCase()) {
        throw new Error("Purchase confirmed for the previous wallet. Reconnect that wallet to view it.");
      }
      setState((current) => buyPack(current, packId));
    } catch (caught) {
      setError(walletErrorMessage(caught, "Purchase was rejected. Try again."));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }, [offline]);

  const claim = useCallback((snapshot: ClaimSnapshot) => {
    if (!offline) { setError("Payout claims are not available yet."); return; }
    setState((current) => claimPayout(current, snapshot));
  }, [offline]);

  const value = useMemo(
    () => ({ state, busy, error, transactionUrl, offline, select, setSpend, setExtraSpend, cast, buy, claim }),
    [state, busy, error, transactionUrl, offline, select, setSpend, setExtraSpend, cast, buy, claim],
  );

  return (
    <DayStoreContext.Provider value={value}>{children}</DayStoreContext.Provider>
  );
}