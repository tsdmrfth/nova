import { containsForbiddenFinanceTerm } from "@nova/shared";
import { describe, expect, it } from "vitest";
import { ONBOARDING_COPY } from "./onboardingCopy";

describe("onboarding copy lock", () => {
  it("wires COPY-S1 / ONBOARDING-EDGE-COPY Connect + grant + tutorial + geo", () => {
    expect(ONBOARDING_COPY.headline).toBe("Nova just woke up.");
    expect(ONBOARDING_COPY.connectCta).toBe("Connect wallet");
    expect(ONBOARDING_COPY.continueCta).toBe("Continue");
    expect(ONBOARDING_COPY.checkbox).toBe("I accept the rules above");
    expect(ONBOARDING_COPY.grantTitle).toBe("+10 Free Influence");
    expect(ONBOARDING_COPY.grantFirstDay).toMatch(/skip Extra/);
    expect(ONBOARDING_COPY.tutorialTitle).toBe("How today works");
    expect(ONBOARDING_COPY.tutorialSteps[0]).toMatch(/MOST, LEAST, or MIDDLE/);
    expect(ONBOARDING_COPY.tutorialSteps[1]).toMatch(/doesn't buy a better pick/);
    expect(ONBOARDING_COPY.tutorialGotIt).toBe("Got it");
    expect(ONBOARDING_COPY.tutorialSkip).toBe("Skip");
    expect(ONBOARDING_COPY.geoTitle).toBe("Not available here yet");
    expect(ONBOARDING_COPY.geoCta).toBe("OK");
    expect(ONBOARDING_COPY.networkTitle).toBe("Switch to Arc");
    expect(ONBOARDING_COPY.networkSwitch).toBe("Switch to Arc");
    expect(ONBOARDING_COPY.networkRetry).toBe("Retry");
  });

  it("keeps locked geo body and no APR / odds / Circle-official claims", () => {
    const blob = JSON.stringify(ONBOARDING_COPY);
    expect(blob).toMatch(/Nova isn't available in your region yet/);
    expect(containsForbiddenFinanceTerm(blob)).toBeUndefined();
    expect(blob.toLowerCase()).not.toMatch(/partnered with circle/);
    expect(blob.toLowerCase()).not.toMatch(/\bapr\b|\bodds\b|\brtp\b/);
    expect(blob).toMatch(/not Circle's official program/);
  });
});
