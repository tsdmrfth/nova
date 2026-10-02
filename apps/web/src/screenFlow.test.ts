import { describe, expect, it } from "vitest";
import { PRODUCT_ROUTES } from "./productRoutes";
import { SCREEN_FLOW, SCREEN_LAYERS, SCREEN_PLACES, screenMotion } from "./screenFlow";

describe("screen flow", () => {
  it("only names real routes", () => {
    const paths = new Set<string>([...PRODUCT_ROUTES.map((route) => route.path), "/demo"]);
    for (const path of [...SCREEN_FLOW, ...SCREEN_LAYERS, ...SCREEN_PLACES]) {
      expect(paths.has(path), path).toBe(true);
    }
  });

  it("moves forward and back along the daily loop", () => {
    expect(screenMotion("/connect", "/")).toBe("forward");
    expect(screenMotion("/", "/vote")).toBe("forward");
    expect(screenMotion("/vote", "/confirmation")).toBe("forward");
    expect(screenMotion("/", "/confirmation")).toBe("forward");
    expect(screenMotion("/confirmation", "/results")).toBe("forward");

    expect(screenMotion("/vote", "/")).toBe("back");
    expect(screenMotion("/confirmation", "/vote")).toBe("back");
    expect(screenMotion("/results", "/")).toBe("back");
    expect(screenMotion("/", "/connect")).toBe("back");
  });

  it("covers with a layer and uncovers the loop underneath", () => {
    expect(screenMotion("/", "/buy")).toBe("up");
    expect(screenMotion("/vote", "/buy")).toBe("up");
    expect(screenMotion("/confirmation", "/demo")).toBe("up");
    expect(screenMotion("/neighborhood", "/buy")).toBe("up");
    expect(screenMotion("/buy", "/vote")).toBe("down");
    expect(screenMotion("/buy", "/confirmation")).toBe("down");
    expect(screenMotion("/demo", "/")).toBe("down");
  });

  it("hands off to a place from the top, and back from below", () => {
    expect(screenMotion("/", "/neighborhood")).toBe("aside");
    expect(screenMotion("/vote", "/neighborhood")).toBe("aside");
    expect(screenMotion("/buy", "/neighborhood")).toBe("aside");
    expect(screenMotion("/neighborhood", "/")).toBe("return");
    expect(screenMotion("/neighborhood", "/results")).toBe("return");
  });

  it("stays still on the same screen or an unknown one", () => {
    expect(screenMotion("/", "/")).toBe("none");
    expect(screenMotion("/vote/", "/vote")).toBe("none");
    expect(screenMotion("/", "/somewhere")).toBe("none");
  });
});
