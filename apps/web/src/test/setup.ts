import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import { clearOnboardingStorage } from "../onboarding/onboardingStorage";

// Node ≥ 25 ships its own global `localStorage` / `sessionStorage` (undefined
// without --localstorage-file), which shadows jsdom's. Point them back at jsdom.
const dom = (globalThis as { jsdom?: { window: Window } }).jsdom;
if (dom) {
  for (const key of ["localStorage", "sessionStorage"] as const) {
    Object.defineProperty(globalThis, key, {
      configurable: true,
      get: () => dom.window[key],
    });
  }
}

afterEach(() => {
  cleanup();
  clearOnboardingStorage();
  try {
    globalThis.localStorage?.clear();
  } catch {
    // Node environment without storage.
  }
});

// Existing game UX tests exercise the explicit offline preview mode.
beforeEach(() => { vi.stubEnv("VITE_WALLET_MODE", "mock"); });
