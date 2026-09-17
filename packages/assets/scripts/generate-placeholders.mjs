#!/usr/bin/env node
/**
 * Writes abstract P1-02 canon placeholders (sunset city, tiles, Nova).
 * Not photographic FINAL-HOME art — lock colors/composition only.
 */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ART_LOCK = "2026-09-17";
const createdAt = "2026-09-17T00:00:00.000Z";

function sha256(contents) {
  return createHash("sha256").update(contents).digest("hex");
}

function write(rel, contents) {
  const abs = join(root, "canon", rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, contents);
  return { path: rel, sha256: sha256(contents) };
}

const sky = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#F7D7A4"/>
      <stop offset="18%" stop-color="#F0B06A"/>
      <stop offset="38%" stop-color="#D27A62"/>
      <stop offset="58%" stop-color="#6E8FBF"/>
      <stop offset="100%" stop-color="#07111C"/>
    </linearGradient>
    <radialGradient id="sun" cx="62%" cy="38%" r="28%">
      <stop offset="0%" stop-color="#FFE9C4" stop-opacity="0.95"/>
      <stop offset="35%" stop-color="#F3C27A" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#F3C27A" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#sky)"/>
  <rect width="1920" height="1080" fill="url(#sun)"/>
  <ellipse cx="1180" cy="400" rx="520" ry="70" fill="#F6D9B0" opacity="0.28"/>
</svg>
`;

function skylineSvg() {
  const buildings = [];
  const rng = mulberry32(0xc0ffee);
  const baseY = 640;
  let x = -20;
  while (x < 1980) {
    const w = 36 + Math.floor(rng() * 78);
    const h = 90 + Math.floor(rng() * 280);
    const y = baseY - h;
    const tone = rng() > 0.5 ? "#0A1730" : "#0E2242";
    buildings.push(
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${tone}"/>`,
    );
    if (rng() > 0.72) {
      buildings.push(
        `<rect x="${x + w * 0.35}" y="${y - 36}" width="${Math.max(6, w * 0.12)}" height="36" fill="${tone}"/>`,
      );
    }
    const cols = Math.max(2, Math.floor(w / 14));
    const rows = Math.max(3, Math.floor(h / 22));
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        if (rng() > 0.55) continue;
        const lit = rng() > 0.18;
        const color = lit ? (rng() > 0.82 ? "#3B8EF0" : "#F4C97A") : "#1A2C48";
        buildings.push(
          `<rect x="${x + 6 + c * 12}" y="${y + 10 + r * 18}" width="5" height="8" fill="${color}" opacity="${lit ? 0.9 : 0.35}"/>`,
        );
      }
    }
    x += w + 6 + Math.floor(rng() * 10);
  }
  buildings.push(
    `<path d="M210 640 C210 520 310 470 410 470 C510 470 560 540 560 640 Z" fill="#081428"/>`,
  );
  buildings.push(
    `<path d="M1480 640 L1560 430 L1640 640 Z" fill="#07101F"/>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
  ${buildings.join("\n  ")}
</svg>
`;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  if (a === 0) a = 0xc0ffee;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const water = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
  <defs>
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#12325C"/>
      <stop offset="40%" stop-color="#0B1E3A"/>
      <stop offset="100%" stop-color="#050B14"/>
    </linearGradient>
  </defs>
  <rect x="0" y="620" width="1920" height="460" fill="url(#water)"/>
  <path d="M-40 700 C 240 660, 480 760, 780 710 S 1320 640, 1980 700" fill="none" stroke="#3B8EF0" stroke-width="6" opacity="0.45"/>
  <path d="M-40 760 C 300 800, 620 680, 980 750 S 1500 820, 1980 740" fill="none" stroke="#2775CA" stroke-width="4" opacity="0.35"/>
  <path d="M-20 820 C 400 790, 820 860, 1200 800 S 1700 780, 1960 830" fill="none" stroke="#F4C97A" stroke-width="3" opacity="0.18"/>
  <g opacity="0.25" fill="#8EC5FF">
    <rect x="80" y="880" width="220" height="3"/>
    <rect x="520" y="910" width="160" height="2"/>
    <rect x="1100" y="895" width="280" height="3"/>
    <rect x="1600" y="925" width="140" height="2"/>
  </g>
</svg>
`;

const platform = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
  <defs>
    <radialGradient id="disc" cx="38%" cy="78%" r="42%">
      <stop offset="0%" stop-color="#4A5D78"/>
      <stop offset="45%" stop-color="#1B2A3E"/>
      <stop offset="100%" stop-color="#070D16"/>
    </radialGradient>
  </defs>
  <ellipse cx="620" cy="900" rx="560" ry="90" fill="url(#disc)"/>
  <ellipse cx="620" cy="900" rx="560" ry="90" fill="none" stroke="#3B8EF0" stroke-width="3" opacity="0.35"/>
  <ellipse cx="620" cy="900" rx="420" ry="54" fill="none" stroke="#9EB6D4" stroke-width="1.5" opacity="0.25"/>
  <ellipse cx="620" cy="888" rx="180" ry="16" fill="#2775CA" opacity="0.12"/>
</svg>
`;

const haze = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
  <defs>
    <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
      <stop offset="40%" stop-color="#F4C97A" stop-opacity="0"/>
      <stop offset="58%" stop-color="#E8A05A" stop-opacity="0.18"/>
      <stop offset="70%" stop-color="#07111C" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#haze)"/>
</svg>
`;

const trails = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
  <g fill="none" stroke="#3B8EF0" stroke-linecap="round" opacity="0.35">
    <path d="M40 640 C 280 600, 520 680, 820 620" stroke-width="2"/>
    <path d="M200 690 C 500 650, 800 720, 1200 660" stroke-width="1.5"/>
    <path d="M900 610 C 1200 580, 1500 650, 1880 600" stroke-width="2"/>
  </g>
</svg>
`;

const master = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
  <rect width="1920" height="1080" fill="#07111C"/>
</svg>
`;

const nova = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 760" width="420" height="760">
  <g fill="none">
    <rect x="168" y="18" width="18" height="36" rx="6" fill="#1A1A1E"/>
    <circle cx="177" cy="14" r="8" fill="#3B8EF0"/>
    <rect x="118" y="52" width="184" height="150" rx="48" fill="#F4F7FA"/>
    <rect x="136" y="108" width="148" height="28" rx="10" fill="#0B1220"/>
    <rect x="148" y="116" width="18" height="12" rx="2" fill="#3B8EF0"/>
    <rect x="174" y="116" width="18" height="12" rx="2" fill="#7EC8FF"/>
    <rect x="200" y="116" width="18" height="12" rx="2" fill="#3B8EF0"/>
    <rect x="226" y="116" width="18" height="12" rx="2" fill="#7EC8FF"/>
    <rect x="252" y="116" width="18" height="12" rx="2" fill="#3B8EF0"/>
    <rect x="108" y="214" width="204" height="250" rx="46" fill="#F4F7FA"/>
    <circle cx="210" cy="318" r="38" fill="#0B1A2E"/>
    <circle cx="210" cy="318" r="26" fill="#2775CA"/>
    <circle cx="210" cy="318" r="12" fill="#9BD0FF"/>
    <rect x="52" y="230" width="52" height="168" rx="24" fill="#F4F7FA"/>
    <rect x="316" y="230" width="52" height="168" rx="24" fill="#F4F7FA"/>
    <circle cx="78" y="230" r="22" fill="#1A1A1E"/>
    <circle cx="342" y="230" r="22" fill="#1A1A1E"/>
    <circle cx="78" y="230" r="8" fill="#3B8EF0"/>
    <circle cx="342" y="230" r="8" fill="#3B8EF0"/>
    <rect x="128" y="470" width="70" height="210" rx="28" fill="#F4F7FA"/>
    <rect x="222" y="470" width="70" height="210" rx="28" fill="#F4F7FA"/>
    <circle cx="163" y="470" r="16" fill="#1A1A1E"/>
    <circle cx="257" y="470" r="16" fill="#1A1A1E"/>
    <circle cx="163" y="572" r="12" fill="#1A1A1E"/>
    <circle cx="257" y="572" r="12" fill="#1A1A1E"/>
  </g>
</svg>
`;

const tileStabilize = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="640" height="360">
  <defs>
    <linearGradient id="a" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#12325C"/>
      <stop offset="100%" stop-color="#07111C"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#a)"/>
  <polygon points="320,86 430,250 210,250" fill="#0E2242"/>
  <polygon points="320,110 400,236 240,236" fill="#16345F"/>
  <circle cx="320" cy="168" r="54" fill="none" stroke="#3B8EF0" stroke-width="8" opacity="0.85"/>
  <path d="M320 140 v56 M292 168 h56" stroke="#7EC8FF" stroke-width="6" stroke-linecap="round"/>
</svg>
`;

const tileExpand = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="640" height="360">
  <defs>
    <linearGradient id="b" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#E8A05A"/>
      <stop offset="55%" stop-color="#2775CA"/>
      <stop offset="100%" stop-color="#07111C"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#b)"/>
  <rect x="90" y="150" width="70" height="140" fill="#0B1A2E"/>
  <rect x="175" y="110" width="86" height="180" fill="#10233F"/>
  <rect x="278" y="80" width="64" height="210" fill="#0B1A2E"/>
  <rect x="360" y="128" width="110" height="162" fill="#16345F"/>
  <rect x="490" y="160" width="72" height="130" fill="#0B1A2E"/>
  <rect x="188" y="132" width="8" height="10" fill="#F4C97A"/>
  <rect x="210" y="154" width="8" height="10" fill="#3B8EF0"/>
  <rect x="390" y="160" width="8" height="10" fill="#F4C97A"/>
  <path d="M40 300 C 180 270, 320 320, 620 280" fill="none" stroke="#7EC8FF" stroke-width="4" opacity="0.5"/>
</svg>
`;

const tileRoute = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="640" height="360">
  <defs>
    <linearGradient id="c" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#4A6FA5"/>
      <stop offset="100%" stop-color="#0B1A2E"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#c)"/>
  <rect x="0" y="210" width="640" height="150" fill="#07111C" opacity="0.55"/>
  <path d="M20 250 C 140 200, 260 300, 400 230 S 600 210, 640 240" fill="none" stroke="#3B8EF0" stroke-width="10" opacity="0.8"/>
  <path d="M0 290 C 160 250, 300 330, 480 270 S 620 300, 640 310" fill="none" stroke="#2775CA" stroke-width="6" opacity="0.7"/>
  <circle cx="168" cy="228" r="8" fill="#F4C97A"/>
  <circle cx="452" cy="248" r="8" fill="#7EC8FF"/>
</svg>
`;

const glowFrame = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="640" height="360">
  <rect x="8" y="8" width="624" height="344" rx="28" fill="none" stroke="#3B8EF0" stroke-width="6"/>
</svg>
`;

const files = {
  "scene/scene-home-sunset-city.svg": master,
  "scene/layer-sky-sunset.svg": sky,
  "scene/layer-skyline.svg": skylineSvg(),
  "scene/layer-water-highways.svg": water,
  "scene/layer-platform.svg": platform,
  "vfx/layer-light-trails.svg": trails,
  "vfx/layer-fog-haze.svg": haze,
  "character/nova-idle-stand-3q.svg": nova,
  "tiles/tile-stabilize.svg": tileStabilize,
  "tiles/tile-expand.svg": tileExpand,
  "tiles/tile-route.svg": tileRoute,
  "tiles/tile-selected-glow-frame.svg": glowFrame,
};

const records = [
  ["scene_home_sunset_city", "scene/scene-home-sunset-city.svg", "scene", ["home"]],
  ["layer_sky_sunset", "scene/layer-sky-sunset.svg", "scene", ["home"]],
  ["layer_skyline", "scene/layer-skyline.svg", "scene", ["home"]],
  ["layer_water_highways", "scene/layer-water-highways.svg", "scene", ["home"]],
  ["layer_platform", "scene/layer-platform.svg", "scene", ["home"]],
  ["layer_light_trails", "vfx/layer-light-trails.svg", "vfx", ["home"]],
  ["layer_fog_haze", "vfx/layer-fog-haze.svg", "vfx", ["home"]],
  ["nova_idle_stand_3q", "character/nova-idle-stand-3q.svg", "character", ["home"]],
  ["tile_stabilize", "tiles/tile-stabilize.svg", "tile", ["home"]],
  ["tile_expand", "tiles/tile-expand.svg", "tile", ["home"]],
  ["tile_route", "tiles/tile-route.svg", "tile", ["home"]],
  ["tile_selected_glow_frame", "tiles/tile-selected-glow-frame.svg", "tile", ["home", "shared"]],
];

const hashed = Object.fromEntries(
  Object.entries(files).map(([rel, contents]) => [rel, write(rel, contents)]),
);

const assets = records.map(([id, path, kind, screens]) => ({
  id,
  path,
  kind,
  screens,
  sha256: hashed[path].sha256,
  license: "internal-placeholder",
  artLockVersion: ART_LOCK,
  createdAt,
  approvedBy: "eng-p1-02",
  pixelRatio: 1,
}));

const manifest = {
  version: 1,
  name: "nova-canon",
  artLockVersion: ART_LOCK,
  assets,
  bundles: [
    {
      name: "home",
      assets: assets
        .filter((asset) => asset.screens.includes("home"))
        .map((asset) => ({ alias: asset.id, src: asset.path })),
    },
  ],
};

writeFileSync(
  join(root, "canon/manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

const pack = {
  day: 7,
  screen: "home",
  layers: {
    sky: "layer_sky_sunset",
    far: "layer_skyline",
    mid: "layer_water_highways",
    near: "layer_platform",
    fx: ["layer_light_trails", "layer_fog_haze"],
  },
  masterPlate: "scene_home_sunset_city",
  nova: {
    mode: "sprite",
    spriteId: "nova_idle_stand_3q",
    animation: "idle",
  },
  tiles: {
    A: { artId: "tile_stabilize", labelKey: "choice.stabilize" },
    B: { artId: "tile_expand", labelKey: "choice.expand" },
    C: { artId: "tile_route", labelKey: "choice.route" },
  },
  worldFamily: "stabilize_expand_route",
};

mkdirSync(join(root, "canon/packs"), { recursive: true });
writeFileSync(
  join(root, "canon/packs/home-default.json"),
  `${JSON.stringify(pack, null, 2)}\n`,
);

console.log(`wrote ${assets.length} canon placeholders`);
