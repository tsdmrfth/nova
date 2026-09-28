import { describe, expect, it } from "vitest";
import { colorTokens } from "./tokens";

describe("color tokens", () => {
  it("uses navy-glass accent and glow", () => {
    expect(colorTokens.bg).toBe("#0B1220");
    expect(colorTokens.surface).toBe("rgba(10, 22, 44, 0.72)");
    expect(colorTokens.border).toBe("#1E3A5F");
    expect(colorTokens.text).toBe("#FFFFFF");
    expect(colorTokens.textMuted).toBe("#A8B3C7");
    expect(colorTokens.accent).toBe("#2775CA");
    expect(colorTokens.glow).toBe("#3B8EF0");
    expect(colorTokens.worldGold).toBe("#F0B45A");
  });

  it("does not use cream or amber as HUD chrome", () => {
    const serialized = JSON.stringify(colorTokens).toLowerCase();
    expect(serialized).not.toMatch(
      /amber|#f7f3eb|#fff8ee|#d97706|#f59e0b|#ffbf00|#f6ad55|#d69e2e/,
    );
    expect(colorTokens.accent).not.toBe(colorTokens.worldGold);
  });
});
