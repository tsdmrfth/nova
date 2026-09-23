export const ONBOARDING_STORAGE_KEYS = {
  disclaimerAccepted: "nova.onboarding.disclaimerAccepted",
  tutorialSeen: "nova.onboarding.tutorialSeen",
  connected: "nova.onboarding.connected",
  grantPending: "nova.onboarding.grantPending",
  geoBlocked: "nova.onboarding.geoBlocked",
  network: "nova.onboarding.network",
} as const;

export type PersistedOnboarding = {
  disclaimerAccepted: boolean;
  tutorialSeen: boolean;
  connected: boolean;
};

function readStore(store: Storage | undefined, key: string): string | null {
  if (!store) {
    return null;
  }
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}

function writeStore(
  store: Storage | undefined,
  key: string,
  value: string | null,
): void {
  if (!store) {
    return;
  }
  try {
    if (value === null) {
      store.removeItem(key);
    } else {
      store.setItem(key, value);
    }
  } catch {
    // Private mode / blocked storage must not break first-run.
  }
}

function localStore(): Storage | undefined {
  return typeof localStorage === "undefined" ? undefined : localStorage;
}

function sessionStore(): Storage | undefined {
  return typeof sessionStorage === "undefined" ? undefined : sessionStorage;
}

export function readFlag(store: Storage | undefined, key: string): boolean {
  return readStore(store, key) === "1";
}

export function writeFlag(
  store: Storage | undefined,
  key: string,
  value: boolean,
): void {
  writeStore(store, key, value ? "1" : null);
}

export function readPersistedOnboarding(): PersistedOnboarding {
  const store = localStore();
  return {
    disclaimerAccepted: readFlag(store, ONBOARDING_STORAGE_KEYS.disclaimerAccepted),
    tutorialSeen: readFlag(store, ONBOARDING_STORAGE_KEYS.tutorialSeen),
    connected: readFlag(store, ONBOARDING_STORAGE_KEYS.connected),
  };
}

export function writePersistedOnboarding(value: PersistedOnboarding): void {
  const store = localStore();
  writeFlag(store, ONBOARDING_STORAGE_KEYS.disclaimerAccepted, value.disclaimerAccepted);
  writeFlag(store, ONBOARDING_STORAGE_KEYS.tutorialSeen, value.tutorialSeen);
  writeFlag(store, ONBOARDING_STORAGE_KEYS.connected, value.connected);
}

export function readGrantPending(): boolean {
  return readFlag(sessionStore(), ONBOARDING_STORAGE_KEYS.grantPending);
}

export function writeGrantPending(value: boolean): void {
  writeFlag(sessionStore(), ONBOARDING_STORAGE_KEYS.grantPending, value);
}

export function readSessionGeoBlocked(): boolean {
  return readFlag(sessionStore(), ONBOARDING_STORAGE_KEYS.geoBlocked);
}

export function writeSessionGeoBlocked(value: boolean): void {
  writeFlag(sessionStore(), ONBOARDING_STORAGE_KEYS.geoBlocked, value);
}

export function readSessionNetwork(): "arc" | "wrong" {
  return readStore(sessionStore(), ONBOARDING_STORAGE_KEYS.network) === "wrong"
    ? "wrong"
    : "arc";
}

export function writeSessionNetwork(value: "arc" | "wrong"): void {
  writeStore(
    sessionStore(),
    ONBOARDING_STORAGE_KEYS.network,
    value === "wrong" ? "wrong" : null,
  );
}

/** Returning-player fixture for tests that are not about first-run. */
export function seedOnboarded(): PersistedOnboarding {
  const value: PersistedOnboarding = {
    disclaimerAccepted: true,
    tutorialSeen: true,
    connected: true,
  };
  writePersistedOnboarding(value);
  writeGrantPending(false);
  writeSessionGeoBlocked(false);
  writeSessionNetwork("arc");
  return value;
}

export function clearOnboardingStorage(): void {
  writePersistedOnboarding({
    disclaimerAccepted: false,
    tutorialSeen: false,
    connected: false,
  });
  writeGrantPending(false);
  writeSessionGeoBlocked(false);
  writeSessionNetwork("arc");
}
