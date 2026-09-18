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
  getDayPack,
  listCanonAssets,
  listPackAssetIds,
  resolvePack,
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

describe("day packs", () => {
  it("resolves the default Home pack against canon", () => {
    const { pack, missing } = resolvePack(canonManifest, 1);
    expect(pack.day).toBe(1);
    expect(pack.screen).toBe("home");
    expect(pack.layers.sky).toBe("layer_sky_sunset");
    expect(pack.layers.far).toBe("layer_skyline");
    expect(pack.layers.mid).toBe("layer_water_highways");
    expect(pack.layers.near).toBe("layer_platform");
    expect(pack.nova.spriteId).toBe("nova_idle_stand_3q");
    expect(pack.tiles.A.artId).toBe("tile_stabilize");
    expect(pack.tiles.B.artId).toBe("tile_expand");
    expect(pack.tiles.C.artId).toBe("tile_route");
    expect(missing).toEqual([]);
    expect(listPackAssetIds(pack).length).toBeGreaterThan(6);
  });

  it("falls back to the Home plates while keeping the requested day", () => {
    const pack = getDayPack(7);
    expect(pack.day).toBe(7);
    expect(pack.layers.sky).toBe("layer_sky_sunset");
    expect(pack.tiles.A.artId).toBe("tile_stabilize");
  });
});

describe("buy pack plates", () => {
  it("exposes Spark and Pulse as buy-screen canon ids", () => {
    expect(getAssetUrl("pack_spark")).toBeTruthy();
    expect(getAssetUrl("pack_pulse")).toBeTruthy();
    expect(getAsset("pack_spark")?.screens).toContain("buy");
    expect(getAsset("pack_pulse")?.screens).toContain("buy");
    expect(getAsset("pack_spark")?.path).not.toMatch(/drafts/);
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
