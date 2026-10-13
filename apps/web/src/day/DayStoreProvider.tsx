import { quotePack, sparkForDay, type PackId } from "@nova/shared";
import type { ChoiceId } from "@nova/assets";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { chainErrorMessage } from "../chain/chainErrors";
import { useNovaChain } from "../chain/chainContext";
import { resultsDayFor, type ChainDay, type ChainDayResult, type DayWinner } from "../chain/novaChain";
import { explorerTxUrl } from "../demo/demoConfig";
import { useOnboarding } from "../onboarding/useOnboarding";
import { DayStoreContext } from "./dayStoreContext";
import {
  EMPTY_DAY_UI,
  canCast,
  dayStateFromChain,
  selectChoice,
  setExtraSpendAmount,
  setSpendAmount,
  uiFromState,
  type ClaimStatus,
  type DayState,
  type DayUi,
} from "./dayStore";

/** How often the pool is re-read while the app is open. */
export const CHAIN_POLL_MS = 20_000;

/** setTimeout delays are 32-bit; re-arm until the vote actually closes. */
const CLOCK_ARM_MS = 60_000;

/**
 * Local clock for the vote-close check. The snapshot is cached so render stays
 * pure; subscribers hear about a new time when the tab refocuses or the close arrives.
 */
const voteClock = {
  now: Date.now(),
  listeners: new Set<() => void>(),
};

function publishVoteClock() {
  voteClock.now = Date.now();
  for (const listener of voteClock.listeners) listener();
}

function subscribeVoteClock(listener: () => void) {
  voteClock.listeners.add(listener);
  const onFocus = () => publishVoteClock();
  window.addEventListener("focus", onFocus);
  return () => {
    voteClock.listeners.delete(listener);
    window.removeEventListener("focus", onFocus);
  };
}

function getVoteClock() {
  return voteClock.now;
}

/** Clock that moves at the vote-close boundary, not on every render. */
function useVoteClock(closesAt: number | null): number {
  const now = useSyncExternalStore(subscribeVoteClock, getVoteClock, getVoteClock);

  useEffect(() => {
    if (closesAt === null) return;
    let timer = 0;
    let cancelled = false;
    const arm = () => {
      if (cancelled) return;
      const remaining = closesAt - Date.now();
      timer = window.setTimeout(() => {
        if (cancelled) return;
        publishVoteClock();
        if (closesAt - Date.now() > 0) arm();
      }, remaining <= 0 ? 0 : Math.min(remaining, CLOCK_ARM_MS));
    };
    arm();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [closesAt]);

  return now;
}

const NO_WINNERS: DayWinner[] = [];

type Loaded = {
  account: string | null;
  day: ChainDay;
  result: ChainDayResult | null;
  winners: DayWinner[];
};
type Keyed<T> = { account: string | null; value: T };

export function DayStoreProvider({ children }: { children: ReactNode }) {
  const chain = useNovaChain();
  const { account } = useOnboarding();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Local picks, errors and links belong to the wallet that made them.
  const [ui, setUi] = useState<Keyed<DayUi>>({ account, value: EMPTY_DAY_UI });
  const [action, setAction] = useState<Keyed<{ error: string | null; url: string | null }>>({
    account,
    value: { error: null, url: null },
  });
  const [claimPhase, setClaimPhase] = useState<{ phase: "idle" | "pending" | "failed"; url: string | null }>({
    phase: "idle",
    url: null,
  });
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const generation = useRef(0);

  const refresh = useCallback(async () => {
    if (!chain) return;
    const version = ++generation.current;
    try {
      const day = await chain.readDay(account);
      const through = day.settled ? day.dayId : day.dayId - 1;
      const [result, winners] = await Promise.all([
        chain.readResult(resultsDayFor(day), account),
        through >= 1 ? chain.readWinners(through) : Promise.resolve([]),
      ]);
      if (version !== generation.current) return;
      setLoaded({ account, day, result, winners });
      setLoadError(null);
    } catch (caught) {
      if (version === generation.current) {
        setLoadError(chainErrorMessage(caught, `Couldn't reach ${chain.chainName}. Retrying…`));
      }
    }
  }, [chain, account]);

  // Subscribe to the pool: read now, poll, and re-read when the player comes back.
  useEffect(() => {
    const versions = generation;
    const reread = () => void refresh();
    const first = window.setTimeout(reread, 0);
    const timer = window.setInterval(reread, CHAIN_POLL_MS);
    window.addEventListener("focus", reread);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
      window.removeEventListener("focus", reread);
      ++versions.current;
    };
  }, [refresh]);

  const current = loaded && loaded.account === account ? loaded : null;
  const dayUi = ui.account === account ? ui.value : EMPTY_DAY_UI;
  const actionState = useMemo(
    () => (action.account === account ? action.value : { error: null, url: null }),
    [action, account],
  );
  const result = current?.result ?? null;
  const winners = current?.winners ?? NO_WINNERS;
  const now = useVoteClock(current?.day.closesAt ?? null);

  const state = useMemo<DayState>(() => {
    const next = dayStateFromChain(current?.day ?? null, dayUi, account, now, winners);
    if (result && result.dayId === next.day && result.entry.claimed) {
      const correct = result.entry.option === result.winnerId;
      return {
        ...next,
        claim: {
          ...result.share,
          spark: sparkForDay({ lockedVote: true, correct, sevenDayStreak: false }).spark,
          winningOptionId: result.winnerId,
        },
      };
    }
    return next;
  }, [current, dayUi, account, result, winners, now]);

  const updateUi = useCallback(
    (change: (state: DayState) => DayState) => {
      setUi({ account, value: uiFromState(change(state), dayUi.lastBuy) });
    },
    [account, state, dayUi.lastBuy],
  );

  const select = useCallback((id: ChoiceId) => updateUi((s) => selectChoice(s, id)), [updateUi]);
  const setSpend = useCallback((amount: number) => updateUi((s) => setSpendAmount(s, amount)), [updateUi]);
  const setExtraSpend = useCallback(
    (amount: number) => updateUi((s) => setExtraSpendAmount(s, amount)),
    [updateUi],
  );

  /** One wallet request at a time; the pool is re-read after every confirmed write. */
  const run = useCallback(
    async (write: (from: string) => Promise<string>, after?: (hash: string) => void): Promise<boolean> => {
      if (pending.current) return false;
      if (!chain) {
        setAction({ account, value: { error: "The game contract is not configured for this build.", url: null } });
        return false;
      }
      if (!account) {
        setAction({ account, value: { error: "Connect your wallet first.", url: null } });
        return false;
      }
      pending.current = true;
      setBusy(true);
      setAction({ account, value: { error: null, url: null } });
      try {
        const hash = await write(account);
        setAction({ account, value: { error: null, url: explorerTxUrl(chain.explorerUrl, hash) } });
        after?.(hash);
        await refresh();
        return true;
      } catch (caught) {
        setAction({ account, value: { error: chainErrorMessage(caught, "Request failed. Try again."), url: null } });
        return false;
      } finally {
        pending.current = false;
        setBusy(false);
      }
    },
    [chain, account, refresh],
  );

  const cast = useCallback(async () => {
    if (!canCast(state) || !state.selected || !chain) return false;
    const option = state.selected;
    const { spendAmount, extraSpendAmount } = state;
    return run((from) => chain.castVote(from, option, spendAmount, extraSpendAmount));
  }, [state, chain, run]);

  const buy = useCallback(
    async (packId: PackId) => {
      if (state.status === "cast") return false;
      return run(
        (from) => (chain ? chain.buy(from, packId) : Promise.reject(new Error("No pool configured."))),
        (hash) =>
          setUi({
            account,
            value: {
              ...dayUi,
              // New Extra defaults onto the stepper, as before the vote.
              extraSpendAmount: null,
              lastBuy: {
                ok: true,
                packId,
                extraInfluence: quotePack(packId).extraInfluence,
                onPick: null,
                txUrl: chain ? explorerTxUrl(chain.explorerUrl, hash) : null,
              },
            },
          }),
      );
    },
    [chain, run, account, dayUi, state.status],
  );

  const claim = useCallback(async () => {
    if (!chain || !account || !result || claimPhase.phase === "pending") return;
    setClaimPhase({ phase: "pending", url: null });
    try {
      const hash = await chain.claim(account, result.dayId);
      const url = explorerTxUrl(chain.explorerUrl, hash);
      await refresh();
      setClaimPhase({ phase: "idle", url });
    } catch (caught) {
      setAction({ account, value: { error: chainErrorMessage(caught, "Claim didn't go through."), url: null } });
      setClaimPhase({ phase: "failed", url: null });
    }
  }, [chain, account, result, claimPhase.phase, refresh]);

  const claimStatus: ClaimStatus =
    claimPhase.phase === "pending"
      ? "pending"
      : result?.entry.claimed
        ? "claimed"
        : claimPhase.phase === "failed"
          ? "failed"
          : "idle";

  const value = useMemo(
    () => ({
      state,
      available: chain !== null,
      ready: current !== null,
      busy,
      error: actionState.error ?? loadError,
      transactionUrl: actionState.url,
      result,
      claimStatus,
      claimUrl: claimPhase.url,
      select,
      setSpend,
      setExtraSpend,
      cast,
      buy,
      claim,
    }),
    [state, chain, current, busy, actionState, loadError, result, claimStatus, claimPhase.url, select, setSpend, setExtraSpend, cast, buy, claim],
  );

  return <DayStoreContext.Provider value={value}>{children}</DayStoreContext.Provider>;
}
