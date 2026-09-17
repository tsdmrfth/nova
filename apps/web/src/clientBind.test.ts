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
    ].join("\n");
    expect(css).toContain("#2775CA");
    expect(css).toContain("#3B8EF0");
    expect(css.toLowerCase()).not.toMatch(/#f59e0b|#ffbf00|#f6ad55|#d69e2e|amber/);
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
    const scene = readFileSync("apps/web/src/scene/HomeSceneHost.tsx", "utf8");
    expect(hud).toContain('data-testid={`choice-${choice.id}`}');
    expect(hud).toContain('data-testid="cast-influence"');
    expect(scene).toContain('data-testid="scene-stage"');
  });
});
