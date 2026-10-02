import { createContext } from "react";
import type { OnboardingSnapshot } from "./onboardingModel";

export type OnboardingContextValue = {
  state: OnboardingSnapshot;
  account: string | null;
  walletBusy: boolean;
  walletError: string | null;
  chainName: string;
  onboarded: boolean;
  setRulesChecked(checked: boolean): void;
  connect(): Promise<boolean>;
  continueAsMock(): boolean;
  switchToArc(): Promise<void>;
  retryConnect(): Promise<boolean>;
  retryWallet(): void;
  openWallet(): Promise<boolean>;
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
