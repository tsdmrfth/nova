import { describe, expect, it } from "vitest";
import {
  applyEdgeQuery,
  canProceed,
  completeTutorial,
  continueOnboarding,
  createOnboardingSnapshot,
  dismissGrant,
  isOnboarded,
  mockConnect,
  openWallet,
  parseOnboardingSearch,
  retryConnect,
  retryWallet,
  setRulesChecked,
  switchToArc,
} from "./onboardingModel";

describe("onboarding model", () => {
  it("parses QA edge query params", () => {
    expect(parseOnboardingSearch("?edge=geo")).toEqual({
      geoBlocked: true,
      network: "arc",
      fault: null,
    });
    expect(parseOnboardingSearch("geo=blocked&network=wrong")).toEqual({
      geoBlocked: true,
      network: "wrong",
      fault: null,
    });
    expect(parseOnboardingSearch("edge=network").network).toBe("wrong");
    expect(parseOnboardingSearch("edge=locked").fault).toBe("locked");
  });

  it("blocks connect until the disclaimer checkbox is accepted", () => {
    const closed = createOnboardingSnapshot();
    expect(canProceed(closed)).toBe(false);
    expect(mockConnect(closed)).toEqual(closed);
    const checked = setRulesChecked(closed, true);
    expect(isOnboarded(mockConnect(checked))).toBe(true);
  });

  it("grants a first-run toast on mock connect / continue", () => {
    const ready = setRulesChecked(createOnboardingSnapshot(), true);
    const connected = mockConnect(ready);
    expect(connected.connected).toBe(true);
    expect(connected.disclaimerAccepted).toBe(true);
    expect(connected.grantPending).toBe(true);
    expect(isOnboarded(connected)).toBe(true);
    expect(dismissGrant(connected).grantPending).toBe(false);
    expect(completeTutorial(connected).tutorialSeen).toBe(true);

    const continued = continueOnboarding(ready);
    expect(continued.connected).toBe(true);
    expect(continued.grantPending).toBe(true);
  });

  it("holds Home behind wrong-network until Switch to Arc + retry", () => {
    const ready = applyEdgeQuery(setRulesChecked(createOnboardingSnapshot(), true), {
      geoBlocked: false,
      network: "wrong",
      fault: null,
    });
    const attempted = mockConnect(ready);
    expect(attempted.face).toBe("network");
    expect(isOnboarded(attempted)).toBe(false);
    const switched = switchToArc(attempted);
    expect(switched.network).toBe("arc");
    expect(isOnboarded(retryConnect(switched))).toBe(true);
  });

  it("surfaces wallet reject / locked faces from the connect stub", () => {
    const rejected = applyEdgeQuery(
      setRulesChecked(createOnboardingSnapshot(), true),
      { geoBlocked: false, network: "arc", fault: "rejected" },
    );
    expect(mockConnect(rejected).face).toBe("rejected");
    expect(retryWallet(rejected).face).toBe("welcome");

    const locked = applyEdgeQuery(
      setRulesChecked(createOnboardingSnapshot(), true),
      { geoBlocked: false, network: "arc", fault: "locked" },
    );
    expect(mockConnect(locked).face).toBe("locked");
    expect(isOnboarded(openWallet(locked))).toBe(true);
  });

  it("never onboards a geo-blocked snapshot", () => {
    const blocked = applyEdgeQuery(
      setRulesChecked(createOnboardingSnapshot(), true),
      { geoBlocked: true, network: "arc", fault: null },
    );
    expect(blocked.geoBlocked).toBe(true);
    expect(isOnboarded(mockConnect(blocked))).toBe(false);
    expect(isOnboarded(continueOnboarding(blocked))).toBe(false);
  });
});
