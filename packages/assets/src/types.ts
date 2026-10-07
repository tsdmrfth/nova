export const ART_LOCK_VERSION = "2026-09-17";

export type AssetKind = "scene" | "character" | "tile" | "hud" | "vfx" | "audio";

export type AssetScreen =
  | "home"
  | "vote"
  | "results"
  | "buy"
  | "season"
  | "connect"
  | "shared";

export type ChoiceId = "A" | "B" | "C";

export type AssetRecord = {
  id: string;
  path: string;
  kind: AssetKind;
  screens: AssetScreen[];
  sha256: string;
  license: string;
  artLockVersion: string;
  createdAt: string;
  approvedBy: string;
  pixelRatio?: 1 | 2;
  spineSkeletonId?: string;
  frameCount?: number;
};

export type CanonAsset = {
  alias: string;
  src: string;
};

export type CanonBundle = {
  name: string;
  assets: CanonAsset[];
};

export type CanonManifest = {
  version: number;
  name: string;
  artLockVersion: string;
  assets: AssetRecord[];
  bundles: CanonBundle[];
};
