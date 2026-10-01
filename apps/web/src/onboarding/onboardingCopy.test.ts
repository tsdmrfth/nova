import { containsForbiddenFinanceTerm, grantDailyFree } from "@nova/shared";
import { describe, expect, it } from "vitest";
import { ONBOARDING_COPY } from "./onboardingCopy";

describe("onboarding copy lock", () => {
  it("wires UI-KIT-V2 Connect, notice, grant, tutorial + ONBOARDING-EDGE-COPY", () => {
    expect(ONBOARDING_COPY.headline).toBe("Raise Nova, one choice a day.");
    expect(ONBOARDING_COPY.connectCta).toBe("Connect Arc wallet");
    expect(ONBOARDING_COPY.noticeTitle).toBe("Before you play");
    expect(ONBOARDING_COPY.noticeBullets).toHaveLength(5);
    expect(ONBOARDING_COPY.noticeBullets.join(" ")).toMatch(/90% to that day's prize pool/);
    expect(ONBOARDING_COPY.checkbox).toBe("I understand this is a soft launch");
    expect(ONBOARDING_COPY.enterCta).toBe("Enter Nova");
    expect(ONBOARDING_COPY.grantTitle).toBe(`Free Influence +${grantDailyFree()}`);
    expect(ONBOARDING_COPY.tutorialTitle).toBe("How today works");
    expect(ONBOARDING_COPY.tutorialSteps("MOST")[1]).toMatch(/Today's goal is MOST/);
    expect(ONBOARDING_COPY.tutorialGotIt).toBe("Got it");
    expect(ONBOARDING_COPY.tutorialSkip).toBe("Skip");
    expect(ONBOARDING_COPY.geoTitle).toBe("Not available here yet");
    expect(ONBOARDING_COPY.geoCta).toBe("OK");
    expect(ONBOARDING_COPY.networkTitle).toBe("Switch to Arc");
    expect(ONBOARDING_COPY.networkSwitch).toBe("Switch to Arc");
    expect(ONBOARDING_COPY.networkRetry).toBe("Retry");
  });

  it("keeps locked geo body and no APR / odds / Circle-official claims", () => {
    const blob = JSON.stringify({
      ...ONBOARDING_COPY,
      tutorialSteps: ONBOARDING_COPY.tutorialSteps("MOST"),
    });
    expect(blob).toMatch(/Nova isn't available in your region yet/);
    expect(containsForbiddenFinanceTerm(blob)).toBeUndefined();
    expect(blob.toLowerCase()).not.toMatch(/partnered with circle/);
    expect(blob.toLowerCase()).not.toMatch(/\bapr\b|\bodds\b|\brtp\b/);
    expect(blob).toMatch(/not Circle's official program/);
  });
});
