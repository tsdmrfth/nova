import { describe, expect, it } from "vitest";
import { hello } from "./hello";

describe("hello", () => {
  it("greets Nova by default", () => {
    expect(hello()).toBe("Hello, Nova!");
  });

  it("greets a provided name", () => {
    expect(hello("Phase 0")).toBe("Hello, Phase 0!");
  });
});
