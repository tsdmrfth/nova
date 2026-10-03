import { createContext } from "react";
import type { OnboardingSnapshot } from "./onboardingModel";

export type OnboardingContextValue = {
  state: OnboardingSnapshot;
  account: string | null;
  walletBusy: boolean;
  /** The first silent wallet read has finished. */
  walletChecked: boolean;
  walletError: string | null;
  chainName: string;
  onboarded: boolean;
  setRulesChecked(checked: boolean): void;
  connect(): Promise<boolean>;
  /** Switches (or adds) the Arc chain; true once the player can reach Home. */
  switchToArc(): Promise<boolean>;
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
