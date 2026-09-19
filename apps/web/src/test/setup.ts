import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { clearOnboardingStorage } from "../onboarding/onboardingStorage";

afterEach(() => {
  cleanup();
  clearOnboardingStorage();
});
