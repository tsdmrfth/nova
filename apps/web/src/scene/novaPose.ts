/**
 * Working-set pose ids.
 * Home, Connect, Confirm, and Buy use idle. Vote uses wave.
 * The Home tutorial beat also asks for wave (Onboarding). Results uses cheer or soft_sad.
 */
export const NOVA_IDLE = "nova_idle_stand_3q";
export const NOVA_WAVE = "nova_wave";
export const NOVA_CHEER = "nova_cheer";
export const NOVA_SOFT_SAD = "nova_soft_sad";

export type NovaScreen =
  | "home"
  | "vote"
  | "connect"
  | "confirm"
  | "buy"
  | "results";

export function novaPoseId(
  screen: NovaScreen,
  outcome: "correct" | "miss" | "idle" = "idle",
): string {
  if (screen === "vote") {
    return NOVA_WAVE;
  }
  if (screen === "results") {
    if (outcome === "correct") {
      return NOVA_CHEER;
    }
    if (outcome === "miss") {
      return NOVA_SOFT_SAD;
    }
  }
  return NOVA_IDLE;
}
