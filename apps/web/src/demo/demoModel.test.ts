import { containsForbiddenFinanceTerm } from "@nova/shared";
import { describe, expect, it } from "vitest";
import { demoConfigFromEnv } from "./demoConfig";
import { GRANT_DEMO_COPY } from "./demoCopy";
import { buildGrantDemoModel } from "./demoModel";

describe("grant demo model", () => {
  it("quotes Spark and Pulse from shared 90/8/2 math", () => {
    const model = buildGrantDemoModel(demoConfigFromEnv({}));
    expect(model.rows.map((row) => row.pct)).toEqual(["90%", "8%", "2%"]);
    expect(model.rows[0]).toMatchObject({ spark: "0.90 USDC", pulse: "4.50 USDC" });
    expect(model.rows[1]).toMatchObject({ spark: "0.08 USDC", pulse: "0.40 USDC" });
    expect(model.rows[2]).toMatchObject({ spark: "0.02 USDC", pulse: "0.10 USDC" });
    expect(model.deployed).toBe(false);
    expect(model.notLive).toMatch(/human deployer/);
  });

  it("keeps the page free of yield language and partnership claims", () => {
    const blob = JSON.stringify({
      copy: GRANT_DEMO_COPY,
      model: buildGrantDemoModel(demoConfigFromEnv({})),
    });
    expect(containsForbiddenFinanceTerm(blob)).toBeUndefined();
    expect(blob.toLowerCase()).not.toMatch(/partnered with circle/);
    expect(blob.toLowerCase()).not.toMatch(/\bapr\b|\bodds\b|\brtp\b/);
    expect(blob).toMatch(/not a general intelligence/);
    expect(blob).toMatch(/no prize top-up/);
    expect(blob).toMatch(/chain id 5042/);
  });
});
