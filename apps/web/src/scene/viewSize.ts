export const MIN_VIEW_PX = 2;
export const LAYOUT_DEBOUNCE_MS = 50;
export const SKYLINE_MAX_STEPS = 512;

export function isUsableViewSize(width: number, height: number): boolean {
  return (
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    width >= MIN_VIEW_PX &&
    height >= MIN_VIEW_PX
  );
}

export function shouldDrawSkyline(width: number, height: number): boolean {
  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0;
}

/** Always advance so a 0/negative-width pass cannot spin forever. */
export function skylineAdvance(width: number, buildingWidth: number): number {
  const span = Number.isFinite(width) ? Math.max(width, 0) : 0;
  const piece = Number.isFinite(buildingWidth) ? Math.max(buildingWidth, 0) : 0;
  return Math.max(1, piece + span * 0.004);
}

export function classifyFxSlot(id: string): "haze" | "trails" | "other" {
  if (id === "layer_fog_haze" || /haze|fog/.test(id)) {
    return "haze";
  }
  if (id === "layer_light_trails" || /trail/.test(id)) {
    return "trails";
  }
  return "other";
}
