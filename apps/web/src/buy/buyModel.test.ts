import { describe, expect, it } from "vitest";
import {
  containsForbiddenFinanceTerm,
  parseUsdc,
  quotePack,
} from "@nova/shared";
import { dayState } from "../test/dayFixtures";
import {
  BUY_COPY,
  DEFAULT_PACK_ID,
  buildBuyModel,
  buyStatus,
  formatCheckoutUsdc,
  packCards,
} from "./buyModel";


describe("checkout formatting", () => {
  it("pads quotePack amounts to two decimal places", () => {
    const spark = quotePack("spark");
    const pulse = quotePack("pulse");
    expect(formatCheckoutUsdc(spark.youPay)).toBe("1.00");
    expect(formatCheckoutUsdc(spark.prizePool)).toBe("0.90");
    expect(formatCheckoutUsdc(spark.studioNet)).toBe("0.08");
    expect(formatCheckoutUsdc(spark.novaBudget)).toBe("0.02");
    expect(formatCheckoutUsdc(pulse.youPay)).toBe("5.00");
    expect(formatCheckoutUsdc(pulse.prizePool)).toBe("4.50");
    expect(formatCheckoutUsdc(pulse.studioNet)).toBe("0.40");
    expect(formatCheckoutUsdc(pulse.novaBudget)).toBe("0.10");
    expect(formatCheckoutUsdc(parseUsdc("1"))).toBe("1.00");
  });
});

describe("buy HUD model", () => {
  it("defaults to Pulse with a 90/8/2 Details breakdown from quotePack", () => {
    const model = buildBuyModel(dayState());
    expect(DEFAULT_PACK_ID).toBe("pulse");
    expect(model.selectedPackId).toBe("pulse");
    expect(model.headline).toBe("Add Extra Influence");
    expect(model.cta).toBe("Confirm buy · 5.00 USDC");
    expect(model.splitTitle).toBe("Where 5.00 USDC goes");
    expect(model.split).toEqual({ prizePool: 90, studioNet: 8, novaBudget: 2 });
    expect(model.freeInfluence).toBe(10);
    expect(model.extraInfluence).toBe(0);
    expect(model.breakdown.youPay).toBe("5.00 USDC");
    expect(model.breakdown.prizePool).toBe("4.50 USDC");
    expect(model.breakdown.prizePoolPct).toBe("90%");
    expect(model.breakdown.studioNet).toBe("0.40 USDC");
    expect(model.breakdown.studioNetPct).toBe("8%");
    expect(model.breakdown.novaBudget).toBe("0.10 USDC");
    expect(model.breakdown.novaBudgetPct).toBe("2%");
    expect(model.breakdown.youReceive).toBe("55 Extra Influence");
    expect(model.ctaEnabled).toBe(true);
    expect(model.packs.map((pack) => pack.id)).toEqual(["spark", "pulse"]);
    expect(model.packs[1]?.badge).toBe("Most chosen");
    expect(model.packs.map((pack) => pack.price)).toEqual(["1", "5"]);
  });

  it("quotes Spark from shared math without mixing Free and Extra", () => {
    const bought = dayState(
      { spentMicro: 1_000_000n, entry: { extraBought: 10 } },
      { lastBuy: { ok: true, packId: "spark", extraInfluence: 10, onPick: null, txUrl: "https://explorer.test/tx/0x1" } },
    );
    const model = buildBuyModel(bought, "spark");
    expect(model.freeInfluence).toBe(10);
    expect(model.extraInfluence).toBe(10);
    expect(model.breakdown.youPay).toBe("1.00 USDC");
    expect(model.breakdown.prizePool).toBe("0.90 USDC");
    expect(model.breakdown.studioNet).toBe("0.08 USDC");
    expect(model.breakdown.novaBudget).toBe("0.02 USDC");
    expect(model.breakdown.youReceive).toBe("10 Extra Influence");
    expect(model.status).toEqual({
      tone: "success",
      title: "+10 Extra Influence added",
      detail: "Purchase confirmed on Arc.",
      txUrl: "https://explorer.test/tx/0x1",
    });
  });

  it("closes the CTA once the vote is locked", () => {
    const model = buildBuyModel(dayState({ entry: { voted: true, option: "A", free: 10 } }));
    expect(model.ctaEnabled).toBe(false);
    expect(model.ctaDisabledReason).toBe(BUY_COPY.closedAfterVote);
  });

  it("disables the CTA after the 10 USDC daily buy cap", () => {
    const state = dayState({ spentMicro: 10_000_000n, entry: { extraBought: 110 } });
    const model = buildBuyModel(state, "pulse");
    expect(model.extraInfluence).toBe(110);
    expect(model.ctaEnabled).toBe(false);
    expect(model.ctaDisabledReason).toBe(BUY_COPY.capExceeded);
  });

  it("renders the real pack catalog (not the kit's 1:1 placeholder) with hukuk-safe copy", () => {
    const model = buildBuyModel(dayState(), "spark");
    expect(packCards().map((pack) => pack.extraLabel)).toEqual(["10 Extra", "55 Extra"]);
    expect(model.cta).toBe("Confirm buy · 1.00 USDC");
    const blob = JSON.stringify({ model, copy: BUY_COPY });
    expect(containsForbiddenFinanceTerm(blob)).toBeUndefined();
    expect(blob.toLowerCase()).not.toMatch(/partnered with circle/);
    expect(blob.toLowerCase()).not.toMatch(/\bapr\b|\bodds\b|\brtp\b/);
    expect(blob).not.toMatch(/Circle logo/i);
  });
});

describe("buy status", () => {
  const confirmed = {
    tone: "success" as const,
    title: "+10 Extra Influence added",
    detail: "Purchase confirmed on Arc.",
    txUrl: "https://explorer.test/tx/0x1",
  };
  const base = { busy: false, failed: false, error: null, youPay: "1.00 USDC", confirmed };

  it("shows wallet progress over everything else", () => {
    expect(buyStatus({ ...base, busy: true, error: "stale" })).toMatchObject({
      tone: "pending",
      detail: "Approve 1.00 USDC, then wait for Arc to confirm.",
    });
  });

  it("heads a failed purchase but not an unrelated read error", () => {
    expect(buyStatus({ ...base, failed: true, error: "Not enough USDC." })).toEqual({
      tone: "error",
      title: "Purchase didn't go through",
      detail: "Not enough USDC.",
      txUrl: null,
    });
    expect(buyStatus({ ...base, error: "Couldn't reach Arc. Retrying…" })).toEqual({
      tone: "error",
      title: "Couldn't reach Arc. Retrying…",
      detail: null,
      txUrl: null,
    });
  });

  it("falls back to the confirmed purchase", () => {
    expect(buyStatus(base)).toBe(confirmed);
    expect(buyStatus({ ...base, confirmed: null })).toBeNull();
  });
});
