import { createContext } from "react";
import type { OnboardingSnapshot } from "./onboardingModel";

export type OnboardingContextValue = {
  state: OnboardingSnapshot;
  onboarded: boolean;
  setRulesChecked(checked: boolean): void;
  connect(): boolean;
  continueAsMock(): boolean;
  switchToArc(): void;
  retryConnect(): boolean;
  retryWallet(): void;
  openWallet(): boolean;
  /** Accept the soft-launch notice; true once the player can reach Home. */
  enterNova(): boolean;
  disconnect(): void;
  dismissGrant(): void;
  completeTutorial(): void;
  reopenTutorial(): void;
};

export const OnboardingContext = createContext<OnboardingContextValue | null>(
  null,
);
