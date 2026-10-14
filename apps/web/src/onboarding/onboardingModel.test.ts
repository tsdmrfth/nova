import { describe, expect, it } from "vitest";
import {
  applyEdgeQuery,
  canProceed,
  completeTutorial,
  createOnboardingSnapshot,
  disconnect,
  dismissGrant,
  enterNova,
  isOnboarded,
  parseOnboardingSearch,
  restoreFace,
  retryWallet,
  setRulesChecked,
  succeedConnect,
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
    const connected = succeedConnect(fresh);
    expect(connected.connected).toBe(true);
    expect(connected.face).toBe("notice");
    expect(connected.grantPending).toBe(false);
    // connected alone is not enough — disclaimer still needed
    expect(isOnboarded(connected)).toBe(false);

    expect(canProceed(connected)).toBe(false);
    expect(enterNova(connected)).toEqual(connected);

    const entered = enterNova(setRulesChecked(connected, true));
    expect(entered.disclaimerAccepted).toBe(true);
    expect(entered.face).toBe("welcome");
    // disclaimer accepted → onboarded (wallet connection no longer required)
    expect(isOnboarded(entered)).toBe(true);
  });

  it("grants the first-run toast on Enter Nova, not on connect", () => {
    const entered = enterNova(setRulesChecked(succeedConnect(createOnboardingSnapshot()), true));
    expect(entered.grantPending).toBe(true);
    expect(dismissGrant(entered).grantPending).toBe(false);
    expect(completeTutorial(entered).tutorialSeen).toBe(true);
  });

  it("skips the notice for a returning player who already accepted", () => {
    const returning = createOnboardingSnapshot({ disclaimerAccepted: true, rulesChecked: true });
    const connected = succeedConnect(returning);
    expect(connected.face).toBe("welcome");
    // returning player with disclaimer accepted is onboarded regardless of wallet state
    expect(isOnboarded(returning)).toBe(true);
    expect(isOnboarded(connected)).toBe(true);
  });

  it("restores the notice on reload for a connected wallet that never accepted", () => {
    const reloaded = restoreFace(createOnboardingSnapshot({ connected: true }));
    expect(reloaded.face).toBe("notice");
    expect(restoreFace(createOnboardingSnapshot()).face).toBe("welcome");
  });

  it("disconnects but stays onboarded (disclaimer persists)", () => {
    const entered = enterNova(setRulesChecked(succeedConnect(createOnboardingSnapshot()), true));
    const out = disconnect(entered);
    expect(out.connected).toBe(false);
    // disclaimer still accepted after disconnect → still onboarded
    expect(isOnboarded(out)).toBe(true);
    expect(out.disclaimerAccepted).toBe(true);
  });

  it("returns a faulted face to Connect on retry", () => {
    const rejected = applyEdgeQuery(createOnboardingSnapshot(), {
      geoBlocked: false,
      network: "arc",
      fault: "rejected",
    });
    expect(retryWallet({ ...rejected, face: "rejected" })).toMatchObject({ face: "welcome", fault: null });
  });

  it("never onboards a geo-blocked snapshot", () => {
    const blocked = applyEdgeQuery(
      setRulesChecked(createOnboardingSnapshot(), true),
      { geoBlocked: true, network: "arc", fault: null },
    );
    expect(blocked.geoBlocked).toBe(true);
    expect(isOnboarded(succeedConnect(blocked))).toBe(false);
    expect(isOnboarded(enterNova(blocked))).toBe(false);
  });
});
