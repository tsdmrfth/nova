import { describe, expect, it } from "vitest";
import { colorTokens } from "./tokens";

describe("color tokens", () => {
  it("uses navy-glass accent and glow", () => {
    expect(colorTokens.accent).toBe("#2775CA");
    expect(colorTokens.glow).toBe("#3B8EF0");
  });

  it("does not use amber", () => {
    const serialized = JSON.stringify(colorTokens).toLowerCase();
    expect(serialized).not.toMatch(/amber|#f59e0b|#ffbf00|#f6ad55|#d69e2e/);
  });
});
