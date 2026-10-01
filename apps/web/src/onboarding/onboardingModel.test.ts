import { describe, expect, it } from "vitest";
import {
  applyEdgeQuery,
  canProceed,
  completeTutorial,
  continueOnboarding,
  createOnboardingSnapshot,
  disconnect,
  dismissGrant,
  enterNova,
  isOnboarded,
  mockConnect,
  openWallet,
  parseOnboardingSearch,
  retryConnect,
  restoreFace,
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

  it("connects first, then gates Enter Nova on the soft-launch notice", () => {
    const fresh = createOnboardingSnapshot();
    const connected = mockConnect(fresh);
    expect(connected.connected).toBe(true);
    expect(connected.face).toBe("notice");
    expect(connected.grantPending).toBe(false);
    expect(isOnboarded(connected)).toBe(false);

    expect(canProceed(connected)).toBe(false);
    expect(enterNova(connected)).toEqual(connected);

    const entered = enterNova(setRulesChecked(connected, true));
    expect(entered.disclaimerAccepted).toBe(true);
    expect(entered.face).toBe("welcome");
    expect(isOnboarded(entered)).toBe(true);
  });

  it("grants the first-run toast on Enter Nova, not on connect", () => {
    const entered = enterNova(setRulesChecked(mockConnect(createOnboardingSnapshot()), true));
    expect(entered.grantPending).toBe(true);
    expect(dismissGrant(entered).grantPending).toBe(false);
    expect(completeTutorial(entered).tutorialSeen).toBe(true);

    const continued = continueOnboarding(createOnboardingSnapshot());
    expect(continued.face).toBe("notice");
  });

  it("skips the notice for a returning player who already accepted", () => {
    const returning = createOnboardingSnapshot({ disclaimerAccepted: true, rulesChecked: true });
    const connected = mockConnect(returning);
    expect(connected.face).toBe("welcome");
    expect(isOnboarded(connected)).toBe(true);
  });

  it("restores the notice on reload for a connected wallet that never accepted", () => {
    const reloaded = restoreFace(createOnboardingSnapshot({ connected: true }));
    expect(reloaded.face).toBe("notice");
    expect(restoreFace(createOnboardingSnapshot()).face).toBe("welcome");
  });

  it("disconnects back to Connect", () => {
    const entered = enterNova(setRulesChecked(mockConnect(createOnboardingSnapshot()), true));
    const out = disconnect(entered);
    expect(out.connected).toBe(false);
    expect(isOnboarded(out)).toBe(false);
    expect(out.disclaimerAccepted).toBe(true);
  });

  it("holds Home behind wrong-network until Switch to Arc + retry", () => {
    const ready = applyEdgeQuery(createOnboardingSnapshot({ disclaimerAccepted: true }), {
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
    const rejected = applyEdgeQuery(createOnboardingSnapshot(), {
      geoBlocked: false,
      network: "arc",
      fault: "rejected",
    });
    expect(mockConnect(rejected).face).toBe("rejected");
    expect(retryWallet(rejected).face).toBe("welcome");

    const locked = applyEdgeQuery(createOnboardingSnapshot(), {
      geoBlocked: false,
      network: "arc",
      fault: "locked",
    });
    expect(mockConnect(locked).face).toBe("locked");
    expect(openWallet(locked).face).toBe("notice");
  });

  it("never onboards a geo-blocked snapshot", () => {
    const blocked = applyEdgeQuery(
      setRulesChecked(createOnboardingSnapshot(), true),
      { geoBlocked: true, network: "arc", fault: null },
    );
    expect(blocked.geoBlocked).toBe(true);
    expect(isOnboarded(mockConnect(blocked))).toBe(false);
    expect(isOnboarded(continueOnboarding(blocked))).toBe(false);
    expect(isOnboarded(enterNova(blocked))).toBe(false);
  });
});
