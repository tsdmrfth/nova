export type NetworkKind = "arc" | "wrong";
export type ConnectFace = "welcome" | "notice" | "network" | "rejected" | "locked";
export type ConnectFault = "rejected" | "locked" | null;

export type OnboardingSnapshot = {
  disclaimerAccepted: boolean;
  tutorialSeen: boolean;
  connected: boolean;
  network: NetworkKind;
  geoBlocked: boolean;
  face: ConnectFace;
  rulesChecked: boolean;
  grantPending: boolean;
  fault: ConnectFault;
};

export type EdgeQuery = {
  geoBlocked: boolean;
  network: NetworkKind;
  fault: ConnectFault;
};

export function createOnboardingSnapshot(
  partial: Partial<OnboardingSnapshot> = {},
): OnboardingSnapshot {
  return {
    disclaimerAccepted: false,
    tutorialSeen: false,
    connected: false,
    network: "arc",
    geoBlocked: false,
    face: "welcome",
    rulesChecked: false,
    grantPending: false,
    fault: null,
    ...partial,
  };
}

export function parseOnboardingSearch(search: string): EdgeQuery {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(raw);
  const edge = params.get("edge");
  const geo = params.get("geo");
  const network = params.get("network");
  const fault: ConnectFault =
    edge === "reject" || edge === "rejected"
      ? "rejected"
      : edge === "locked"
        ? "locked"
        : null;
  return {
    geoBlocked: geo === "blocked" || edge === "geo",
    network: network === "wrong" || edge === "network" ? "wrong" : "arc",
    fault,
  };
}

export function applyEdgeQuery(
  state: OnboardingSnapshot,
  query: EdgeQuery,
): OnboardingSnapshot {
  return {
    ...state,
    geoBlocked: state.geoBlocked || query.geoBlocked,
    network: query.network === "wrong" ? "wrong" : state.network,
    fault: query.fault ?? state.fault,
  };
}

/** Gates "Enter Nova" on the soft-launch notice. */
export function canProceed(state: OnboardingSnapshot): boolean {
  return state.rulesChecked || state.disclaimerAccepted;
}

/** Face to show on a cold load: a connected wallet that never accepted lands on the notice. */
export function restoreFace(state: OnboardingSnapshot): OnboardingSnapshot {
  if (state.connected && !state.disclaimerAccepted) {
    return { ...state, face: "notice" };
  }
  return state;
}

export function setRulesChecked(
  state: OnboardingSnapshot,
  rulesChecked: boolean,
): OnboardingSnapshot {
  return { ...state, rulesChecked };
}

export function isOnboarded(state: OnboardingSnapshot): boolean {
  return state.disclaimerAccepted && state.connected && !state.geoBlocked;
}

function markAccepted(state: OnboardingSnapshot): OnboardingSnapshot {
  return {
    ...state,
    rulesChecked: true,
    disclaimerAccepted: true,
  };
}

function succeedConnect(state: OnboardingSnapshot): OnboardingSnapshot {
  const firstConnect = !state.connected;
  if (!state.disclaimerAccepted) {
    // First run: the soft-launch notice comes next; the grant waits for Enter Nova.
    return { ...state, connected: true, face: "notice", network: "arc" };
  }
  return {
    ...state,
    connected: true,
    face: "welcome",
    grantPending: firstConnect || state.grantPending,
    network: "arc",
  };
}

/** Connect is open to everyone; the rules gate sits on the notice that follows. */
export function mockConnect(state: OnboardingSnapshot): OnboardingSnapshot {
  if (state.geoBlocked) {
    return state;
  }
  if (state.network === "wrong") {
    return { ...state, face: "network" };
  }
  if (state.fault === "rejected") {
    return { ...state, face: "rejected" };
  }
  if (state.fault === "locked") {
    return { ...state, face: "locked" };
  }
  return succeedConnect(state);
}

/** "Enter Nova" on the soft-launch notice. */
export function enterNova(state: OnboardingSnapshot): OnboardingSnapshot {
  if (state.geoBlocked || !state.connected || !canProceed(state)) {
    return state;
  }
  return {
    ...markAccepted(state),
    face: "welcome",
    grantPending: !state.disclaimerAccepted || state.grantPending,
  };
}

export function disconnect(state: OnboardingSnapshot): OnboardingSnapshot {
  return { ...state, connected: false, face: "welcome", grantPending: false };
}

export function continueOnboarding(state: OnboardingSnapshot): OnboardingSnapshot {
  return mockConnect({ ...state, fault: null });
}

export function switchToArc(state: OnboardingSnapshot): OnboardingSnapshot {
  return { ...state, network: "arc" };
}

export function retryConnect(state: OnboardingSnapshot): OnboardingSnapshot {
  return mockConnect({ ...state, face: "welcome", fault: null });
}

export function retryWallet(state: OnboardingSnapshot): OnboardingSnapshot {
  return { ...state, face: "welcome", fault: null };
}

export function openWallet(state: OnboardingSnapshot): OnboardingSnapshot {
  return mockConnect({ ...state, face: "welcome", fault: null });
}

export function dismissGrant(state: OnboardingSnapshot): OnboardingSnapshot {
  return { ...state, grantPending: false };
}

export function completeTutorial(state: OnboardingSnapshot): OnboardingSnapshot {
  return { ...state, tutorialSeen: true };
}
