/** Locked navy-glass HUD. World gold is environment light only. */
export const colorTokens = {
  bg: "#0B1220",
  surface: "rgba(10, 22, 44, 0.72)",
  border: "#1E3A5F",
  text: "#FFFFFF",
  textMuted: "#A8B3C7",
  accent: "#2775CA",
  glow: "#3B8EF0",
  worldGold: "#F0B45A",
} as const;

export type ColorTokenName = keyof typeof colorTokens;
