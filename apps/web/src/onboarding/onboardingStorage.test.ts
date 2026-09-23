/** @vitest-environment jsdom */

import { afterEach, describe, expect, it } from "vitest";
import {
  clearOnboardingStorage,
  ONBOARDING_STORAGE_KEYS,
  readPersistedOnboarding,
  seedOnboarded,
  writeGrantPending,
  writePersistedOnboarding,
  readGrantPending,
} from "./onboardingStorage";

describe("onboarding storage", () => {
  afterEach(() => {
    clearOnboardingStorage();
  });

  it("persists disclaimer + tutorial + mock connect flags in localStorage", () => {
    writePersistedOnboarding({
      disclaimerAccepted: true,
      tutorialSeen: false,
      connected: true,
    });
    expect(localStorage.getItem(ONBOARDING_STORAGE_KEYS.disclaimerAccepted)).toBe(
      "1",
    );
    expect(localStorage.getItem(ONBOARDING_STORAGE_KEYS.tutorialSeen)).toBeNull();
    expect(localStorage.getItem(ONBOARDING_STORAGE_KEYS.connected)).toBe("1");
    expect(readPersistedOnboarding()).toEqual({
      disclaimerAccepted: true,
      tutorialSeen: false,
      connected: true,
    });
  });

  it("keeps the grant toast pending in sessionStorage only", () => {
    writeGrantPending(true);
    expect(sessionStorage.getItem(ONBOARDING_STORAGE_KEYS.grantPending)).toBe("1");
    expect(readGrantPending()).toBe(true);
    expect(localStorage.getItem(ONBOARDING_STORAGE_KEYS.grantPending)).toBeNull();
  });

  it("seeds a returning player without a grant toast", () => {
    seedOnboarded();
    expect(readPersistedOnboarding()).toEqual({
      disclaimerAccepted: true,
      tutorialSeen: true,
      connected: true,
    });
    expect(readGrantPending()).toBe(false);
  });
});
