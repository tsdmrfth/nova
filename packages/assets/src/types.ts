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

export type DayScenePack = {
  day: number;
  screen: "home" | "vote" | "results" | "buy";
  layers: {
    sky: string;
    far: string;
    mid: string;
    near: string;
    fx?: string[];
  };
  masterPlate?: string;
  nova: {
    mode: "spine" | "sprite";
    spineSkeletonId?: string;
    animation?: string;
    spriteId?: string;
  };
  tiles: {
    A: { artId: string; labelKey: string };
    B: { artId: string; labelKey: string };
    C: { artId: string; labelKey: string };
  };
  worldFamily?: "stabilize_expand_route" | "story_self" | string;
};

export type PackResolution = {
  pack: DayScenePack;
  missing: string[];
};
