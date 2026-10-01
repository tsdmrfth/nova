import { useLayoutEffect, type RefObject } from "react";

/** Never shrink below this on top of the `--u` clamp (styles/scale.css). */
export const MIN_FIT = 0.85;

/** Selector for the no-scroll regions the guard keeps inside the frame. */
export const FIT_SELECTOR = "[data-nv-fit]";

/** Largest fit (≤ 1) that removes the worst overflow among the regions. */
export function nextFit(current: number, regions: { scrollHeight: number; clientHeight: number }[]) {
  let ratio = 1;
  for (const { scrollHeight, clientHeight } of regions) {
    if (clientHeight > 0 && scrollHeight > clientHeight + 1) {
      ratio = Math.min(ratio, clientHeight / scrollHeight);
    }
  }
  return Math.max(MIN_FIT, current * ratio);
}

/**
 * Keeps no-scroll screens inside the frame. The `--u` scale already sizes the
 * UI to the frame; when content still overflows (long copy, short viewport),
 * this lowers `--nv-fit` on the frame until every `[data-nv-fit]` region fits.
 * Runs before paint on mount, frame resize, and content changes.
 */
export function useFrameFit(frameRef: RefObject<HTMLElement | null>, enabled: boolean) {
  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    if (!enabled) {
      frame.style.removeProperty("--nv-fit");
      return;
    }

    const fit = () => {
      let value = 1;
      frame.style.setProperty("--nv-fit", "1");
      // Safe-area padding does not scale, so one ratio can undershoot; settle in a few passes.
      for (let pass = 0; pass < 3; pass += 1) {
        const regions = Array.from(frame.querySelectorAll<HTMLElement>(FIT_SELECTOR));
        const next = nextFit(value, regions);
        if (next === value) break;
        value = next;
        frame.style.setProperty("--nv-fit", String(value));
      }
      if (value === 1) frame.style.removeProperty("--nv-fit");
    };

    fit();
    if (typeof ResizeObserver === "undefined") return;
    let live = true;
    const resize = new ResizeObserver(fit);
    resize.observe(frame);
    // Attributes are left out: `fit` writes the frame's style attribute.
    const mutations = new MutationObserver(fit);
    mutations.observe(frame, { childList: true, subtree: true, characterData: true });
    void document.fonts?.ready.then(() => {
      if (live) fit();
    });
    return () => {
      live = false;
      resize.disconnect();
      mutations.disconnect();
    };
  }, [frameRef, enabled]);
}
