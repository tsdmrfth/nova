import { useArcWallet } from "../wallet/useArcWallet";
import { useCallback, useMemo, useReducer, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { OnboardingContext } from "./onboardingContext";
import {
  applyEdgeQuery,
  completeTutorial as completeTutorialState,
  createOnboardingSnapshot,
  disconnect as disconnectState,
  dismissGrant as dismissGrantState,
  enterNova as enterNovaState,
  isOnboarded,
  succeedConnect,
  parseOnboardingSearch,
  restoreFace,
  retryWallet as retryWalletState,
  setRulesChecked,
  type OnboardingSnapshot,
} from "./onboardingModel";
import {
  readGrantPending,
  readPersistedOnboarding,
  readSessionGeoBlocked,
  readSessionNetwork,
  writeGrantPending,
  writePersistedOnboarding,
  writeSessionGeoBlocked,
  writeSessionNetwork,
} from "./onboardingStorage";

type Action =
  | { type: "hydrate"; snapshot: OnboardingSnapshot }
  | { type: "check"; checked: boolean }
  | { type: "retryWallet" }
  | { type: "disconnect" }
  | { type: "dismissGrant" }
  | { type: "completeTutorial" }
  | { type: "reopenTutorial" };

function envGeoBlocked(): boolean {
  return import.meta.env.VITE_GEO_BLOCKED === "1";
}

function persist(state: OnboardingSnapshot): void {
  writePersistedOnboarding({
    disclaimerAccepted: state.disclaimerAccepted,
    tutorialSeen: state.tutorialSeen,
    connected: state.connected,
  });
  writeGrantPending(state.grantPending);
  writeSessionGeoBlocked(state.geoBlocked);
  writeSessionNetwork(state.network);
}

function readInitial(search: string): OnboardingSnapshot {
  const persisted = readPersistedOnboarding();
  const snapshot = createOnboardingSnapshot({
    ...persisted,
    // Only a live wallet session counts as connected.
    connected: false,
    rulesChecked: persisted.disclaimerAccepted,
    grantPending: readGrantPending(),
    geoBlocked: envGeoBlocked() || readSessionGeoBlocked(),
    network: readSessionNetwork(),
  });
  return restoreFace(applyEdgeQuery(snapshot, parseOnboardingSearch(search)));
}

function reducer(state: OnboardingSnapshot, action: Action): OnboardingSnapshot {
  switch (action.type) {
    case "hydrate":
      return action.snapshot;
    case "check":
      return setRulesChecked(state, action.checked);
    case "retryWallet":
      return retryWalletState(state);
    case "disconnect":
      return disconnectState(state);
    case "dismissGrant":
      return dismissGrantState(state);
    case "reopenTutorial":
      return { ...state, tutorialSeen: false };
    case "completeTutorial":
      return completeTutorialState(state);
    default:
      return state;
  }
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const wallet = useArcWallet(true);
  const [searchParams] = useSearchParams();
  const search = searchParams.toString();
  const [state, dispatch] = useReducer(reducer, search, (initialSearch) => {
    const snapshot = readInitial(initialSearch);
    persist(snapshot);
    return snapshot;
  });

  const run = useCallback((action: Action): OnboardingSnapshot => {
    const next = reducer(state, action);
    persist(next);
    dispatch({ type: "hydrate", snapshot: next });
    return next;
  }, [state]);

  const setChecked = useCallback((checked: boolean) => {
    run({ type: "check", checked });
  }, [run]);

  const connect = useCallback(async () => {
    if (state.geoBlocked || !await wallet.connect()) return false;
    const next = succeedConnect({ ...state, network: "arc", fault: null });
    persist(next);
    dispatch({ type: "hydrate", snapshot: next });
    return isOnboarded(next);
  }, [state, wallet]);

  const switchToArc = connect;

  const retryConnect = connect;

  const retryWallet = useCallback(() => {
    run({ type: "retryWallet" });
  }, [run]);

  const openWallet = connect;

  const enterNova = useCallback(() => {
    if (!wallet.account || !wallet.onArc) return false;
    const next = enterNovaState({ ...state, connected: true });
    persist(next);
    dispatch({ type: "hydrate", snapshot: next });
    return isOnboarded(next);
  }, [wallet, state]);

  const disconnect = useCallback(() => {
    wallet.disconnect();
    run({ type: "disconnect" });
  }, [run, wallet]);

  const reopenTutorial = useCallback(() => {
    run({ type: "reopenTutorial" });
  }, [run]);

  const dismissGrant = useCallback(() => {
    run({ type: "dismissGrant" });
  }, [run]);

  const completeTutorial = useCallback(() => {
    run({ type: "completeTutorial" });
  }, [run]);

  const effectiveState = useMemo<OnboardingSnapshot>(() => ({
    ...state,
    connected: Boolean(wallet.account && wallet.onArc),
    network: wallet.onArc ? "arc" : "wrong",
    face: wallet.account && !wallet.onArc
      ? "network"
      : !wallet.account
        ? "welcome"
        : !state.disclaimerAccepted
          ? "notice"
          : state.face,
  }), [state, wallet.account, wallet.onArc]);

  const value = useMemo(
    () => ({
      state: effectiveState,
      account: wallet.account,
      walletBusy: wallet.busy,
      walletChecked: wallet.checked,
      walletError: wallet.error,
      chainName: wallet.chainName,
      onboarded: isOnboarded(effectiveState),
      setRulesChecked: setChecked,
      connect,
      switchToArc,
      retryConnect,
      retryWallet,
      openWallet,
      enterNova,
      disconnect,
      dismissGrant,
      completeTutorial,
      reopenTutorial,
    }),
    [
      effectiveState,
      wallet,
      setChecked,
      connect,
      switchToArc,
      retryConnect,
      retryWallet,
      openWallet,
      enterNova,
      disconnect,
      dismissGrant,
      completeTutorial,
      reopenTutorial,
    ],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}
