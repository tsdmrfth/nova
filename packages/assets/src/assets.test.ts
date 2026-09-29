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
    expect(getAsset("pack_spark")?.path).toBe("packs/buy-pack-spark.png");
    expect(getAsset("pack_pulse")?.path).toBe("packs/buy-pack-pulse.png");
    expect(getAsset("pack_spark")?.screens).toContain("buy");
    expect(getAsset("pack_pulse")?.license).toBe("internal-working-set");
    expect(getAsset("pack_spark")?.path).not.toMatch(/drafts|\.svg$/);
  });

  it("serves BIND §9.1 plates from canon copies", () => {
    expect(getAsset("scene_home_sunset_city")?.path).toBe(
      "scene/scene-home-sunset-city.png",
    );
    expect(getAsset("layer_sky_sunset")?.path).toBe("scene/layer-sky-sunset.png");
    expect(getAsset("nova_idle_stand_3q")?.path).toBe(
      "character/nova-idle-stand-3q.png",
    );
    expect(getAsset("nova_wave")?.path).toBe("character/nova-wave.png");
    expect(getAsset("nova_cheer")?.path).toBe("character/nova-cheer.png");
    expect(getAsset("nova_soft_sad")?.path).toBe("character/nova-soft-sad.png");
    expect(getAsset("tile_stabilize")?.path).toBe("tiles/tile-stabilize.png");
    expect(getAsset("badge_winner")?.path).toBe("hud/badge-winner.png");
    expect(getAsset("scene_home_sunset_city")?.sha256).toBe(
      "7284bbc5b7efac015b2e81e08490791639d8ad12c315204f9af51eeeb1726acc",
    );
    expect(getAsset("badge_winner")?.sha256).toBe(
      "e3d8a8d5e51deecfe771f441b1738d9760060f1d0ad874ec1012b568cdd3f80b",
    );
    expect(getAsset("scene_home_sunset_city")?.license).toBe(
      "internal-working-set",
    );
    expect(getAsset("scene_home_bg_city_nova")?.path).toBe(
      "scene/home-bg-city-nova.png",
    );
    expect(getAsset("scene_home_bg_city_nova")?.sha256).toBe(
      "09e0620bc5751e2791aa176362d6459d9610fc22813312b0c548018a7ef43281",
    );
    expect(getAsset("scene_home_bg_city_nova")?.license).toBe(
      "internal-working-set",
    );
  });
});

describe("results badge", () => {
  it("exposes the winner badge as a results-screen canon id", () => {
    expect(getAssetUrl("badge_winner")).toBeTruthy();
    expect(getAsset("badge_winner")?.screens).toContain("results");
    expect(getAsset("badge_winner")?.path).toBe("hud/badge-winner.png");
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
