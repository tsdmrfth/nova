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
  dismissGrant(): void;
  completeTutorial(): void;
};

export const OnboardingContext = createContext<OnboardingContextValue | null>(
  null,
);
