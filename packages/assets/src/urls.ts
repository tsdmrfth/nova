/**
 * Vite-static URL map. Each `new URL` must be a string literal so the bundler
 * can emit the hashed canon file. Never point these at `drafts/`.
 */
export const canonAssetUrls = {
  scene_nova_city: new URL("../canon/scene/nova-city.webp", import.meta.url).href,
  scene_nova_city_wide: new URL("../canon/scene/nova-city-wide.webp", import.meta.url).href,
} as const;

export type CanonAssetId = keyof typeof canonAssetUrls;
