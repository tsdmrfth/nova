import type { ScreenMotion } from "./ui";

/**
 * The daily loop, read left to right. A later step enters from the right and
 * the earlier one leaves to the left. Going back reverses that.
 */
export const SCREEN_FLOW = ["/connect", "/", "/vote", "/confirmation", "/results"] as const;

/**
 * Layers over whatever is open. They rise from the bottom and cover it; closing
 * one drops it back down and uncovers the screen that stayed underneath.
 */
export const SCREEN_LAYERS = ["/buy", "/guide", "/demo"] as const;

/**
 * A place beside the day, not a step in it and not a layer on it. It arrives
 * from the top in a full handoff, and leaves back upward.
 */
export const SCREEN_PLACES = ["/neighborhood"] as const;

function normalize(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

function rank(list: readonly string[], path: string): number {
  return list.indexOf(path);
}

type ScreenKind = "flow" | "layer" | "place";

function kindOf(path: string): ScreenKind | null {
  if (rank(SCREEN_FLOW, path) >= 0) return "flow";
  if (rank(SCREEN_LAYERS, path) >= 0) return "layer";
  if (rank(SCREEN_PLACES, path) >= 0) return "place";
  return null;
}

/** Direction of the route change `from` → `to` (see ScreenMotion). */
export function screenMotion(fromPath: string, toPath: string): ScreenMotion {
  const from = normalize(fromPath);
  const to = normalize(toPath);
  if (from === to) return "none";
  const fromKind = kindOf(from);
  const toKind = kindOf(to);
  if (!fromKind || !toKind) return "none";

  if (fromKind === "flow" && toKind === "flow") {
    return rank(SCREEN_FLOW, to) > rank(SCREEN_FLOW, from) ? "forward" : "back";
  }
  if (toKind === "layer") return "up";
  if (fromKind === "layer" && toKind === "flow") return "down";
  if (toKind === "place") return "aside";
  if (fromKind === "place") return "return";
  return "none";
}
