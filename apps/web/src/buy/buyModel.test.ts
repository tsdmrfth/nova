import { describe, expect, it } from "vitest";
import { getAssetUrl } from "@nova/assets";
import {
  containsForbiddenFinanceTerm,
  parseUsdc,
  quotePack,
} from "@nova/shared";
import { buyPack, createDayState } from "../day/dayStore";
import {
  BUY_COPY,
  DEFAULT_PACK_ID,
  buildBuyModel,
  formatCheckoutUsdc,
  packCards,
} from "./buyModel";

const now = new Date("2026-09-18T12:00:00");

describe("checkout formatting", () => {
  it("pads quotePack amounts to two decimal places", () => {
    const spark = quotePack("spark");
    const pulse = quotePack("pulse");
    expect(formatCheckoutUsdc(spark.youPay)).toBe("1.00");
    expect(formatCheckoutUsdc(spark.prizePool)).toBe("0.90");
    expect(formatCheckoutUsdc(spark.studioFee)).toBe("0.10");
    expect(formatCheckoutUsdc(pulse.youPay)).toBe("5.00");
    expect(formatCheckoutUsdc(pulse.prizePool)).toBe("4.50");
    expect(formatCheckoutUsdc(pulse.studioFee)).toBe("0.50");
    expect(formatCheckoutUsdc(parseUsdc("1"))).toBe("1.00");
  });
});

describe("buy HUD model", () => {
  it("defaults to Pulse with a 90/10 Details breakdown from quotePack", () => {
    const model = buildBuyModel(createDayState(1, now));
    expect(DEFAULT_PACK_ID).toBe("pulse");
    expect(model.selectedPackId).toBe("pulse");
    expect(model.headline).toBe("Extra Influence");
    expect(model.cta).toBe("Buy with USDC");
    expect(model.freeInfluence).toBe(10);
    expect(model.extraInfluence).toBe(0);
    expect(model.breakdown.youPay).toBe("5.00 USDC");
    expect(model.breakdown.prizePool).toBe("4.50 USDC");
    expect(model.breakdown.prizePoolPct).toBe("90%");
    expect(model.breakdown.studioFee).toBe("0.50 USDC");
    expect(model.breakdown.studioFeePct).toBe("10%");
    expect(model.breakdown.youReceive).toBe("55 Extra Influence");
    expect(model.ctaEnabled).toBe(true);
    expect(model.packs.map((pack) => pack.id)).toEqual(["spark", "pulse"]);
    expect(model.packs[1]?.badge).toBe("Most chosen");
  });

  it("quotes Spark from shared math without mixing Free and Extra", () => {
    const bought = buyPack(createDayState(1, now), "spark");
    const model = buildBuyModel(bought, "spark");
    expect(model.freeInfluence).toBe(10);
    expect(model.extraInfluence).toBe(10);
    expect(model.breakdown.youPay).toBe("1.00 USDC");
    expect(model.breakdown.prizePool).toBe("0.90 USDC");
    expect(model.breakdown.studioFee).toBe("0.10 USDC");
    expect(model.breakdown.youReceive).toBe("10 Extra Influence");
    expect(model.status).toMatch(/You received 10 Extra Influence/);
  });

  it("disables the CTA after the 10 USDC daily buy cap", () => {
    let state = createDayState(1, now);
    state = buyPack(state, "pulse");
    state = buyPack(state, "pulse");
    const model = buildBuyModel(state, "pulse");
    expect(model.extraInfluence).toBe(110);
    expect(model.ctaEnabled).toBe(false);
    expect(model.ctaDisabledReason).toBe(BUY_COPY.capExceeded);
  });

  it("resolves pack art through canon ids and keeps hukuk-safe copy", () => {
    const model = buildBuyModel(createDayState(1, now), "spark");
    for (const pack of packCards()) {
      expect(getAssetUrl(pack.artId)).toBeTruthy();
      expect(pack.artId).not.toMatch(/drafts/);
    }
    const blob = JSON.stringify({ model, copy: BUY_COPY });
    expect(containsForbiddenFinanceTerm(blob)).toBeUndefined();
    expect(blob.toLowerCase()).not.toMatch(/partnered with circle/);
    expect(blob.toLowerCase()).not.toMatch(/\bapr\b|\bodds\b|\brtp\b/);
    expect(blob).not.toMatch(/Circle logo/i);
  });
});
