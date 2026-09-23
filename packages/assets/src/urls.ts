/**
 * Vite-static URL map. Each `new URL` must be a string literal so the bundler
 * can emit hashed canon files. Never point these at `drafts/`.
 */
export const canonAssetUrls = {
  scene_home_sunset_city: new URL(
    "../canon/scene/scene-home-sunset-city.svg",
    import.meta.url,
  ).href,
  layer_sky_sunset: new URL(
    "../canon/scene/layer-sky-sunset.svg",
    import.meta.url,
  ).href,
  layer_skyline: new URL("../canon/scene/layer-skyline.svg", import.meta.url)
    .href,
  layer_water_highways: new URL(
    "../canon/scene/layer-water-highways.svg",
    import.meta.url,
  ).href,
  layer_platform: new URL(
    "../canon/scene/layer-platform.svg",
    import.meta.url,
  ).href,
  layer_light_trails: new URL(
    "../canon/vfx/layer-light-trails.svg",
    import.meta.url,
  ).href,
  layer_fog_haze: new URL("../canon/vfx/layer-fog-haze.svg", import.meta.url)
    .href,
  nova_idle_stand_3q: new URL(
    "../canon/character/nova-idle-stand-3q.svg",
    import.meta.url,
  ).href,
  tile_stabilize: new URL(
    "../canon/tiles/tile-stabilize.svg",
    import.meta.url,
  ).href,
  tile_expand: new URL("../canon/tiles/tile-expand.svg", import.meta.url).href,
  tile_route: new URL("../canon/tiles/tile-route.svg", import.meta.url).href,
  tile_selected_glow_frame: new URL(
    "../canon/tiles/tile-selected-glow-frame.svg",
    import.meta.url,
  ).href,
  pack_spark: new URL("../canon/hud/pack-spark.svg", import.meta.url).href,
  pack_pulse: new URL("../canon/hud/pack-pulse.svg", import.meta.url).href,
  badge_winner: new URL("../canon/hud/badge-winner.svg", import.meta.url).href,
} as const;

export type CanonAssetId = keyof typeof canonAssetUrls;
