import canon from "../canon/manifest.json" with { type: "json" };
import { assetReference } from "./reference";
import type { AssetRecord, CanonManifest } from "./types";
import { canonAssetUrls } from "./urls";

export const canonManifest = canon as CanonManifest;

const byId = new Map<string, AssetRecord>(
  canonManifest.assets.map((asset) => [asset.id, asset]),
);

const DRAFTS_MARK = "drafts/";

function isDraftPath(path: string): boolean {
  return path.includes(DRAFTS_MARK) || path.includes("..");
}

export function listCanonAssets(): AssetRecord[] {
  return canonManifest.assets;
}

export function getAsset(id: string): AssetRecord | null {
  const asset = byId.get(id) ?? null;
  if (!asset) {
    console.error(`[nova/assets] missing canon id: ${id}`);
    return null;
  }
  if (isDraftPath(asset.path)) {
    console.error(`[nova/assets] drafts are invisible to Client: ${id}`);
    return null;
  }
  return asset;
}

export function assertCanon(id: string): boolean {
  if (assetReference.active !== "canon") {
    console.error("[nova/assets] Client production builds may only read canon");
    return false;
  }
  return getAsset(id) !== null;
}

export function getAssetUrl(id: string): string | null {
  if (!assertCanon(id)) {
    return null;
  }
  if (!(id in canonAssetUrls)) {
    console.error(`[nova/assets] no bundled URL for canon id: ${id}`);
    return null;
  }
  return canonAssetUrls[id as keyof typeof canonAssetUrls];
}
