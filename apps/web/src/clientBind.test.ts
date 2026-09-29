import { globSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("client bind contract", () => {
  const sources = globSync("apps/web/src/**/*.{ts,tsx,css}").filter(
    (file) => !file.includes(".test."),
  );

  it("never imports drafts/", () => {
    expect(sources.length).toBeGreaterThan(0);
    for (const file of sources) {
      const text = readFileSync(file, "utf8");
      expect(text, file).not.toMatch(/drafts\//);
    }
  });

  it("keeps electric blue tokens and no amber primary", () => {
    const css = [
      readFileSync("apps/web/src/index.css", "utf8"),
      readFileSync("apps/web/src/App.css", "utf8"),
      readFileSync("apps/web/src/hud/HomeHud.css", "utf8"),
      readFileSync("apps/web/src/buy/BuyHud.css", "utf8"),
      readFileSync("apps/web/src/results/ResultsHud.css", "utf8"),
      readFileSync("apps/web/src/confirmation/ConfirmationHud.css", "utf8"),
      readFileSync("apps/web/src/pages/ProfilePage.css", "utf8"),
      readFileSync("apps/web/src/onboarding/onboarding.css", "utf8"),
    ].join("\n");
    expect(css).toContain("#2775CA");
    expect(css).toContain("#3B8EF0");
    expect(css).toContain("#081329");
    expect(css).toContain("#4880D6");
    expect(css).toContain("--color-world-gold");
    expect(css).toContain("Fraunces");
    expect(css).toContain("DM Sans");
    expect(css).toContain("IBM Plex Mono");
    expect(css.toLowerCase()).not.toMatch(
      /#f7f3eb|#fff8ee|#d97706|#f59e0b|#ffbf00|#f6ad55|#d69e2e|amber/,
    );
  });

  it("lets the cinema Home HUD scroll on small viewports", () => {
    const css = readFileSync("apps/web/src/App.css", "utf8");
    const hud = readFileSync("apps/web/src/hud/HomeHud.css", "utf8");
    expect(css).toMatch(/max-width: 900px/);
    expect(css).toMatch(/overflow-y:\s*auto/);
    expect(hud).toMatch(/grid-template-rows:\s*auto auto auto auto/);
  });

  it("exposes Playwright test ids on the Home HUD", () => {
    const hud = readFileSync("apps/web/src/hud/HomeHud.tsx", "utf8");
    const buy = readFileSync("apps/web/src/buy/BuyHud.tsx", "utf8");
    const results = readFileSync("apps/web/src/results/ResultsHud.tsx", "utf8");
    const profile = readFileSync("apps/web/src/pages/ProfilePage.tsx", "utf8");
    const scene = readFileSync("apps/web/src/scene/HomeSceneHost.tsx", "utf8");
    const connect = readFileSync("apps/web/src/onboarding/ConnectHud.tsx", "utf8");
    const toast = readFileSync("apps/web/src/onboarding/GrantToast.tsx", "utf8");
    const confirmation = readFileSync(
      "apps/web/src/confirmation/ConfirmationHud.tsx",
      "utf8",
    );
    const tutorial = readFileSync(
      "apps/web/src/onboarding/TutorialOverlay.tsx",
      "utf8",
    );
    expect(hud).toContain('data-testid={`choice-${choice.id}`}');
    expect(hud).toContain('data-testid="cast-influence"');
    expect(hud).toContain('data-testid="day-goal"');
    expect(hud).toContain('data-testid="spend-free"');
    expect(hud).toContain('data-testid="buy-entry"');
    expect(buy).toContain('data-testid="buy-cta"');
    expect(buy).toContain('data-testid={`buy-pack-${pack.id}`}');
    expect(results).toContain('data-testid="results-claim"');
    expect(results).toContain('data-testid="results-canon"');
    expect(results).toContain('data-testid="results-spark"');
    expect(profile).toContain('data-testid="profile-casts"');
    expect(profile).not.toMatch(/results-claim|Claim \{/);
    expect(scene).toContain('data-testid="scene-stage"');
    expect(connect).toContain('data-testid="connect-cta"');
    expect(connect).toContain('data-testid="connect-checkbox"');
    expect(connect).toContain('testId="geo-block"');
    expect(connect).toContain('testId: "network-switch"');
    expect(toast).toContain('data-testid="grant-toast"');
    expect(confirmation).toContain('data-testid="confirmation-results"');
    expect(confirmation).toContain('data-testid="confirmation-free"');
    expect(confirmation).toContain('data-testid="confirmation-extra"');
    expect(confirmation).toContain('data-testid="confirmation-close"');
    expect(tutorial).toContain('data-testid="tutorial-skip"');
  });

  it("never uses Submit vote or Circle-official claims in the client", () => {
    expect(sources.length).toBeGreaterThan(0);
    for (const file of sources) {
      const text = readFileSync(file, "utf8");
      expect(text, file).not.toMatch(/Submit vote/i);
      expect(text, file).not.toMatch(/partnered with Circle/i);
      const claimsOfficial =
        /circle's official/i.test(text) &&
        !/not circle's official/i.test(text);
      expect(claimsOfficial, file).toBe(false);
      expect(text, file).not.toMatch(/\bAPR\b/);
      expect(text, file).not.toMatch(/\bRTP\b/);
      expect(text, file).not.toMatch(/house edge/i);
    }
  });
});
