export const appConfig = {
  name: "Nova",
  phase: 1,
} as const;

export type AppConfig = typeof appConfig;

export { colorTokens } from "./tokens";
export type { ColorTokenName } from "./tokens";
