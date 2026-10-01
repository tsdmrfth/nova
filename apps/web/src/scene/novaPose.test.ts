import { describe, expect, it } from "vitest";
import { NOVA_CHEER, NOVA_IDLE, NOVA_SOFT_SAD, NOVA_WAVE, novaPoseId } from "./novaPose";

describe("nova pose by screen", () => {
  it("uses idle on Home, Connect, Confirm, and Buy", () => {
    expect(novaPoseId("home")).toBe(NOVA_IDLE);
    expect(novaPoseId("connect")).toBe(NOVA_IDLE);
    expect(novaPoseId("confirm")).toBe(NOVA_IDLE);
    expect(novaPoseId("buy")).toBe(NOVA_IDLE);
  });

  it("uses wave on Vote", () => {
    expect(novaPoseId("vote")).toBe(NOVA_WAVE);
  });

  it("uses cheer or soft_sad on Results", () => {
    expect(novaPoseId("results", "correct")).toBe(NOVA_CHEER);
    expect(novaPoseId("results", "miss")).toBe(NOVA_SOFT_SAD);
    expect(novaPoseId("results", "idle")).toBe(NOVA_IDLE);
  });
});