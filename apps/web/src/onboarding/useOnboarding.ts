import { useContext } from "react";
import {
  OnboardingContext,
  type OnboardingContextValue,
} from "./onboardingContext";

export function useOnboarding(): OnboardingContextValue {
  const value = useContext(OnboardingContext);
  if (!value) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return value;
}
