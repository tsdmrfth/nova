import { describe, expect, it } from "vitest";
import { assetReference, canonManifest } from "./index";

describe("canon manifest", () => {
  it("is a valid empty canon", () => {
    expect(canonManifest.version).toBe(1);
    expect(canonManifest.name).toBe("nova-canon");
    expect(canonManifest.bundles).toEqual([]);
  });
});

describe("asset reference", () => {
  it("points at canon and drafts", () => {
    expect(assetReference.active).toBe("canon");
    expect(assetReference.canon).toBe("canon/manifest.json");
    expect(assetReference.drafts).toBe("drafts/");
  });
});
