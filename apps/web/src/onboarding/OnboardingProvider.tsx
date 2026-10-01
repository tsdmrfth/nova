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

  const connect = useCallback(() => isOnboarded(run({ type: "connect" })), [run]);

  const continueAsMock = useCallback(
    () => isOnboarded(run({ type: "continue" })),
    [run],
  );

  const switchToArc = useCallback(() => {
    run({ type: "switchArc" });
  }, [run]);

  const retryConnect = useCallback(
    () => isOnboarded(run({ type: "retry" })),
    [run],
  );

  const retryWallet = useCallback(() => {
    run({ type: "retryWallet" });
  }, [run]);

  const openWallet = useCallback(
    () => isOnboarded(run({ type: "openWallet" })),
    [run],
  );

  const enterNova = useCallback(() => isOnboarded(run({ type: "enter" })), [run]);

  const disconnect = useCallback(() => {
    run({ type: "disconnect" });
  }, [run]);

  const reopenTutorial = useCallback(() => {
    run({ type: "reopenTutorial" });
  }, [run]);

  const dismissGrant = useCallback(() => {
    run({ type: "dismissGrant" });
  }, [run]);

  const completeTutorial = useCallback(() => {
    run({ type: "completeTutorial" });
  }, [run]);

  const value = useMemo(
    () => ({
      state,
      onboarded: isOnboarded(state),
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
      state,
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
