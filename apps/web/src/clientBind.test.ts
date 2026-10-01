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

  it("keeps the UI-KIT-V2 electric blue tokens and no amber primary", () => {
    const tokens = readFileSync("apps/web/src/styles/tokens.css", "utf8");
    const kit = readFileSync("design/ui-kit-v2/nova-theme.css", "utf8");
    // tokens.css mirrors the kit theme verbatim (minus the header comment).
    expect(tokens.split("\n").slice(1).join("\n")).toBe(kit.split("\n").slice(1).join("\n"));
    for (const hex of ["#4880d6", "#2785ff", "#71b9ff", "#06162e", "#f5f8ff"]) {
      expect(tokens).toContain(hex);
    }
    const css = sources
      .filter((file) => file.endsWith(".css"))
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");
    expect(css.toLowerCase()).not.toMatch(
      /#f7f3eb|#fff8ee|#d97706|#f59e0b|#ffbf00|#f6ad55|#d69e2e|amber/,
    );
    expect(readFileSync("apps/web/src/main.tsx", "utf8")).toContain("@fontsource/inter");
  });

  it("lets every cinema screen scroll inside the phone frame on small viewports", () => {
    const ui = readFileSync("apps/web/src/ui/ui.css", "utf8");
    expect(ui).toMatch(/\.nv-screen__frame \{[^}]*height: 100dvh/);
    expect(ui).toMatch(/\.nv-screen__hud \{[^}]*overflow-y: auto/);
    expect(ui).toMatch(/\.nv-screen__hud \{[^}]*flex-direction: column/);
  });

  it("exposes Playwright test ids on every v2 screen", () => {
    const read = (file: string) => readFileSync(`apps/web/src/${file}`, "utf8");
    const has = (text: string, id: string) =>
      text.includes(`data-testid="${id}"`) ||
      text.includes(`testId="${id}"`) ||
      text.includes(`testId: "${id}"`) ||
      text.includes(`root: "${id}"`);
    const expectIds = (file: string, ids: string[]) => {
      const text = read(file);
      for (const id of ids) {
        expect(has(text, id), `${file} → ${id}`).toBe(true);
      }
    };
    expectIds("hud/HomeView.tsx", ["day-goal", "hud-free", "hud-extra", "hud-menu", "hud-rank", "home-cta"]);
    expect(read("hud/HomeView.tsx")).toContain("testId={`choice-${choice.id}`}");
    expectIds("hud/VoteView.tsx", ["cast-influence", "spend-free", "spend-extra", "spend-split", "buy-entry"]);
    expectIds("buy/BuyHud.tsx", ["buy-cta", "buy-breakdown", "buy-back"]);
    expect(read("buy/BuyHud.tsx")).toContain("data-testid={`buy-pack-${pack.id}`}");
    expectIds("results/ResultsHud.tsx", ["results-claim", "results-winner", "results-shares", "claim-retry", "claim-done"]);
    expectIds("menu/MenuSheet.tsx", ["menu-sheet", "menu-calm", "menu-disconnect", "profile-casts"]);
    expectIds("onboarding/ConnectHud.tsx", ["connect-cta", "geo-block", "network-switch"]);
    expectIds("onboarding/SoftLaunchNotice.tsx", ["connect-checkbox", "notice-enter"]);
    expectIds("onboarding/GrantToast.tsx", ["grant-toast"]);
    expectIds("onboarding/TutorialOverlay.tsx", ["tutorial-skip", "tutorial-got-it"]);
    expectIds("confirmation/ConfirmationHud.tsx", [
      "confirmation-results",
      "confirmation-free",
      "confirmation-extra",
      "confirmation-close",
    ]);
    expectIds("ui/ScreenFrame.tsx", ["nova-scene"]);
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
