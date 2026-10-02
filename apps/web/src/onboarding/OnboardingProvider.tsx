import { offlineWalletPreview } from "../wallet/walletMode";
import { useArcWallet } from "../wallet/useArcWallet";
import { useCallback, useMemo, useReducer, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { OnboardingContext } from "./onboardingContext";
import {
  applyEdgeQuery,
  completeTutorial as completeTutorialState,
  continueOnboarding,
  createOnboardingSnapshot,
  disconnect as disconnectState,
  dismissGrant as dismissGrantState,
  enterNova as enterNovaState,
  isOnboarded,
  mockConnect,
  succeedConnect,
  openWallet as openWalletState,
  parseOnboardingSearch,
  retryConnect as retryConnectState,
  restoreFace,
  retryWallet as retryWalletState,
  setRulesChecked,
  switchToArc as switchToArcState,
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
  | { type: "connect" }
  | { type: "continue" }
  | { type: "switchArc" }
  | { type: "retry" }
  | { type: "retryWallet" }
  | { type: "openWallet" }
  | { type: "enter" }
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
    connected: offlineWalletPreview() && persisted.connected,
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
    case "connect":
      return mockConnect(state);
    case "continue":
      return continueOnboarding(state);
    case "switchArc":
      return switchToArcState(state);
    case "retry":
      return retryConnectState(state);
    case "retryWallet":
      return retryWalletState(state);
    case "openWallet":
      return openWalletState(state);
    case "enter":
      return enterNovaState(state);
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
  const realWallet = !offlineWalletPreview();
  const wallet = useArcWallet(realWallet);
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
    if (!realWallet) return isOnboarded(run({ type: "connect" }));
    if (state.geoBlocked || !await wallet.connect()) return false;
    const next = succeedConnect({ ...state, network: "arc", fault: null });
    persist(next);
    dispatch({ type: "hydrate", snapshot: next });
    return isOnboarded(next);
  }, [realWallet, run, state, wallet]);

  const continueAsMock = useCallback(
    () => !realWallet && isOnboarded(run({ type: "continue" })),
    [realWallet, run],
  );

  const switchToArc = useCallback(async () => {
    if (realWallet) { await connect(); return; }
    run({ type: "switchArc" });
  }, [realWallet, connect, run]);

  const retryConnect = useCallback(
    async () => realWallet ? connect() : isOnboarded(run({ type: "retry" })),
    [realWallet, connect, run],
  );

  const retryWallet = useCallback(() => {
    run({ type: "retryWallet" });
  }, [run]);

  const openWallet = useCallback(
    async () => realWallet ? connect() : isOnboarded(run({ type: "openWallet" })),
    [realWallet, connect, run],
  );

  const enterNova = useCallback(() => {
    if (realWallet && (!wallet.account || !wallet.onArc)) return false;
    const next = enterNovaState({ ...state, connected: realWallet ? Boolean(wallet.account) : state.connected });
    persist(next);
    dispatch({ type: "hydrate", snapshot: next });
    return isOnboarded(next);
  }, [realWallet, wallet, state]);

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

  const effectiveState = useMemo(() => realWallet ? { ...state, connected: Boolean(wallet.account && wallet.onArc), network: wallet.onArc ? "arc" as const : "wrong" as const, face: wallet.account && !wallet.onArc ? "network" as const : !wallet.account ? "welcome" as const : !state.disclaimerAccepted ? "notice" as const : state.face } : state, [realWallet, state, wallet.account, wallet.onArc]);

  const value = useMemo(
    () => ({
      state: effectiveState,
      account: wallet.account,
      walletBusy: wallet.busy,
      walletError: wallet.error,
      chainName: wallet.chainName,
      onboarded: isOnboarded(effectiveState),
      setRulesChecked: setChecked,
      connect,
      continueAsMock,
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
      continueAsMock,
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
