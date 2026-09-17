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
  bundles: CanonBundle[];
};

import canon from "./canon.manifest.json" with { type: "json" };

export const canonManifest: CanonManifest = canon;
