export const colorTokens = {
  accent: "#2775CA",
  glow: "#3B8EF0",
} as const;

export type ColorTokenName = keyof typeof colorTokens;
