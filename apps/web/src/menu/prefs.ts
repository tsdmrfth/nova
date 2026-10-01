import { useCallback, useSyncExternalStore } from "react";

/** Per-device Menu settings. Conveniences only — never game state. */
export const PREF_KEYS = {
  calmMotion: "nova.prefs.calmMotion",
  dailyReminder: "nova.prefs.dailyReminder",
} as const;

export type PrefKey = keyof typeof PREF_KEYS;

const listeners = new Set<() => void>();

export function readPref(key: PrefKey): boolean {
  try {
    return window.localStorage.getItem(PREF_KEYS[key]) === "1";
  } catch {
    return false;
  }
}

export function writePref(key: PrefKey, on: boolean): void {
  try {
    if (on) {
      window.localStorage.setItem(PREF_KEYS[key], "1");
    } else {
      window.localStorage.removeItem(PREF_KEYS[key]);
    }
  } catch {
    // Storage blocked: the toggle still works for this render.
  }
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void): () => void {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

export function usePref(key: PrefKey): [boolean, (on: boolean) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => readPref(key),
    () => false,
  );
  const set = useCallback((on: boolean) => writePref(key, on), [key]);
  return [value, set];
}
