import { describe, expect, it } from "vitest";
import { PRODUCT_ROUTES } from "./productRoutes";

describe("product routes", () => {
  it("defines the 8 product routes", () => {
    expect(PRODUCT_ROUTES.map((route) => route.id)).toEqual([
      "connect",
      "home",
      "vote",
      "buy",
      "confirmation",
      "results",
      "neighborhood",
      "profile",
    ]);
  });

  it("uses unique paths", () => {
    const paths = PRODUCT_ROUTES.map((route) => route.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
