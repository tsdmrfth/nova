/**
 * Vite-static URL map. Each `new URL` must be a string literal so the bundler
 * can emit hashed canon files. Never point these at `drafts/`.
 * Photographic plates are real copies under `canon/` per UI-REBUILD-BIND §9.
 */
export const canonAssetUrls = {
  scene_home_sunset_city: new URL(
    "../canon/scene/scene-home-sunset-city.png",
    import.meta.url,
  ).href,
  scene_home_bg_city_nova: new URL(
    "../canon/scene/home-bg-city-nova.png",
    import.meta.url,
  ).href,
  layer_sky_sunset: new URL(
    "../canon/scene/layer-sky-sunset.png",
    import.meta.url,
  ).href,
  layer_skyline: new URL("../canon/scene/layer-skyline.png", import.meta.url)
    .href,
  layer_water_highways: new URL(
    "../canon/scene/layer-water-highways.png",
    import.meta.url,
  ).href,
  layer_platform: new URL(
    "../canon/scene/layer-platform.png",
    import.meta.url,
  ).href,
  layer_light_trails: new URL(
    "../canon/vfx/layer-light-trails.svg",
    import.meta.url,
  ).href,
  layer_fog_haze: new URL("../canon/vfx/layer-fog-haze.svg", import.meta.url)
    .href,
  nova_idle_stand_3q: new URL(
    "../canon/character/nova-idle-stand-3q.png",
    import.meta.url,
  ).href,
  nova_wave: new URL("../canon/character/nova-wave.png", import.meta.url).href,
  nova_cheer: new URL("../canon/character/nova-cheer.png", import.meta.url)
    .href,
  nova_soft_sad: new URL(
    "../canon/character/nova-soft-sad.png",
    import.meta.url,
  ).href,
  tile_stabilize: new URL(
    "../canon/tiles/tile-stabilize.png",
    import.meta.url,
  ).href,
  tile_expand: new URL("../canon/tiles/tile-expand.png", import.meta.url).href,
  tile_route: new URL("../canon/tiles/tile-route.png", import.meta.url).href,
  tile_selected_glow_frame: new URL(
    "../canon/tiles/tile-selected-glow-frame.svg",
    import.meta.url,
  ).href,
  icon_day: new URL("../canon/hud/icon-day.svg", import.meta.url).href,
  icon_free_influence: new URL(
    "../canon/hud/icon-free-influence.svg",
    import.meta.url,
  ).href,
  icon_extra_influence: new URL(
    "../canon/hud/icon-extra-influence.svg",
    import.meta.url,
  ).href,
  icon_usdc: new URL("../canon/hud/icon-usdc.svg", import.meta.url).href,
  icon_cast_influence: new URL(
    "../canon/hud/icon-cast-influence.svg",
    import.meta.url,
  ).href,
  icon_plus: new URL("../canon/hud/icon-plus.svg", import.meta.url).href,
  pack_spark: new URL("../canon/packs/buy-pack-spark.png", import.meta.url)
    .href,
  pack_pulse: new URL("../canon/packs/buy-pack-pulse.png", import.meta.url)
    .href,
  badge_winner: new URL("../canon/hud/badge-winner.png", import.meta.url).href,
} as const;

export type CanonAssetId = keyof typeof canonAssetUrls;
