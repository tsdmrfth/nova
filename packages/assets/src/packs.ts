import homeDefault from "../canon/packs/home-default.json" with { type: "json" };
import { getAsset } from "./canon";
import type {
  CanonManifest,
  ChoiceId,
  DayScenePack,
  PackResolution,
} from "./types";

export const DEFAULT_HOME_DAY = 7;

const homePack = homeDefault as DayScenePack;

const packsByDay = new Map<number, DayScenePack>([[homePack.day, homePack]]);

export function getDayPack(day: number): DayScenePack {
  const found = packsByDay.get(day);
  if (found) {
    return found;
  }
  return { ...homePack, day };
}

export function listPackAssetIds(pack: DayScenePack): string[] {
  return [
    pack.layers.sky,
    pack.layers.far,
    pack.layers.mid,
    pack.layers.near,
    ...(pack.layers.fx ?? []),
    pack.masterPlate,
    pack.nova.spriteId,
    pack.nova.spineSkeletonId,
    pack.tiles.A.artId,
    pack.tiles.B.artId,
    pack.tiles.C.artId,
  ].filter((id): id is string => Boolean(id));
}

export function resolvePack(
  manifest: CanonManifest,
  day: number,
): PackResolution {
  const pack = getDayPack(day);
  const known = new Set(manifest.assets.map((asset) => asset.id));
  const missing = listPackAssetIds(pack).filter((id) => {
    if (!known.has(id)) {
      return true;
    }
    return getAsset(id) === null;
  });
  return { pack, missing };
}

export function tileArtId(pack: DayScenePack, id: ChoiceId): string {
  return pack.tiles[id].artId;
}
