import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import {
  ART_LOCK_VERSION,
  assertCanon,
  canonAssetUrls,
  canonManifest,
  getAsset,
  getAssetUrl,
  listCanonAssets,
} from "./index";
import { assetReference } from "./reference";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("canon manifest", () => {
  it("is a versioned home bundle with art lock", () => {
    expect(canonManifest.version).toBe(1);
    expect(canonManifest.name).toBe("nova-canon");
    expect(canonManifest.artLockVersion).toBe(ART_LOCK_VERSION);
    expect(canonManifest.assets.length).toBeGreaterThan(0);
    expect(canonManifest.bundles[0]?.name).toBe("home");
  });

  it("never points at drafts", () => {
    for (const asset of listCanonAssets()) {
      expect(asset.path).not.toMatch(/drafts/);
      expect(asset.path).not.toMatch(/\.\./);
      expect(getAsset(asset.id)?.path).toBe(asset.path);
      expect(assertCanon(asset.id)).toBe(true);
    }
    expect(assetReference.active).toBe("canon");
    expect(assetReference.drafts).toBe("drafts/");
  });

  it("hashes match files on disk", () => {
    for (const asset of listCanonAssets()) {
      const bytes = readFileSync(join(packageRoot, "canon", asset.path));
      const digest = createHash("sha256").update(bytes).digest("hex");
      expect(asset.sha256).toBe(digest);
      expect(getAssetUrl(asset.id)).toBeTruthy();
    }
  });

  it("has a bundled URL for every record", () => {
    const ids = listCanonAssets().map((asset) => asset.id).sort();
    expect(Object.keys(canonAssetUrls).sort()).toEqual(ids);
  });
});

describe("live plate", () => {
  it("publishes only the city plate the screens render", () => {
    expect(listCanonAssets().map((asset) => asset.id)).toEqual(["scene_nova_city"]);
    expect(getAsset("scene_nova_city")?.path).toBe("scene/nova-city.webp");
    expect(getAssetUrl("scene_nova_city")).toBeTruthy();
    expect(canonManifest.bundles).toEqual([
      {
        name: "home",
        assets: [{ alias: "scene_nova_city", src: "scene/nova-city.webp" }],
      },
    ]);
  });
});

describe("missing ids", () => {
  it("do not throw", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(getAsset("not_a_real_asset")).toBeNull();
    expect(assertCanon("not_a_real_asset")).toBe(false);
    expect(getAssetUrl("not_a_real_asset")).toBeNull();
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});
