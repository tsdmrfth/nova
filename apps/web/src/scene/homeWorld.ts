import {
  assertCanon,
  collectPackIds,
  getAssetUrl,
  listPackAssetIds,
  type ChoiceId,
  type DayScenePack,
} from "@nova/assets";
import {
  Assets,
  Container,
  FillGradient,
  Graphics,
  Sprite,
  type Application,
} from "pixi.js";
import type { ScenePhase } from "./sceneTypes";
import {
  classifyFxSlot,
  isUsableViewSize,
  shouldDrawSkyline,
  skylineAdvance,
  SKYLINE_MAX_STEPS,
} from "./viewSize";

export type HomeWorldHandle = {
  layout(width: number, height: number): void;
  setSelected(id: ChoiceId | null): void;
  setPhase(phase: ScenePhase): void;
  setReducedMotion(value: boolean): void;
  tick(elapsedMs: number): void;
  destroy(): void;
};

type LayerKind = "sky" | "far" | "mid" | "near" | "fx" | "nova";

type Layer = {
  id: string;
  kind: LayerKind;
  depth: number;
  container: Container;
  graphics: Graphics;
  sprite: Sprite | null;
  recipe: (graphics: Graphics, width: number, height: number) => void;
};

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function verticalGradient(
  stops: Array<{ offset: number; color: string }>,
): FillGradient {
  return new FillGradient({
    type: "linear",
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
    colorStops: stops,
  });
}

function drawSky(graphics: Graphics, width: number, height: number): void {
  graphics
    .rect(0, 0, width, height)
    .fill(
      verticalGradient([
        { offset: 0, color: "#f7d7a4" },
        { offset: 0.16, color: "#f0b06a" },
        { offset: 0.34, color: "#d4785c" },
        { offset: 0.52, color: "#6e8fbf" },
        { offset: 0.72, color: "#12325c" },
        { offset: 1, color: "#07111c" },
      ]),
    );

  const sunX = width * 0.62;
  const sunY = height * 0.36;
  const sun = new FillGradient({
    type: "radial",
    center: { x: 0.5, y: 0.5 },
    innerRadius: 0,
    outerRadius: 0.5,
    colorStops: [
      { offset: 0, color: "#ffe9c4" },
      { offset: 0.35, color: "#f3c27a" },
      { offset: 1, color: "#f3c27a00" },
    ],
  });
  graphics
    .circle(sunX, sunY, Math.max(width, height) * 0.28)
    .fill(sun);
  graphics
    .ellipse(sunX, sunY + height * 0.04, width * 0.28, height * 0.045)
    .fill({ color: 0xf6d9b0, alpha: 0.22 });
}

function drawSkyline(graphics: Graphics, width: number, height: number): void {
  if (!shouldDrawSkyline(width, height)) {
    return;
  }

  const horizon = height * 0.58;
  const rng = mulberry32(0xc0ffee);
  let x = -width * 0.02;
  let steps = 0;
  while (x < width * 1.04 && steps < SKYLINE_MAX_STEPS) {
    const buildingWidth = width * (0.018 + rng() * 0.042);
    const buildingHeight = height * (0.08 + rng() * 0.28);
    const y = horizon - buildingHeight;
    const fill = rng() > 0.5 ? 0x0a1730 : 0x0e2242;
    graphics.rect(x, y, buildingWidth, buildingHeight).fill(fill);
    if (rng() > 0.72) {
      graphics
        .rect(
          x + buildingWidth * 0.38,
          y - height * 0.035,
          Math.max(3, buildingWidth * 0.1),
          height * 0.035,
        )
        .fill(fill);
    }
    const cols = Math.max(2, Math.floor(buildingWidth / 14));
    const rows = Math.max(3, Math.floor(buildingHeight / 18));
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (rng() > 0.52) continue;
        const lit = rng() > 0.2;
        graphics
          .rect(x + 5 + col * 12, y + 8 + row * 16, 4, 7)
          .fill({
            color: lit ? (rng() > 0.82 ? 0x3b8ef0 : 0xf4c97a) : 0x1a2c48,
            alpha: lit ? 0.92 : 0.35,
          });
      }
    }
    const step = skylineAdvance(width, buildingWidth);
    if (step <= 0) {
      break;
    }
    x += step;
    steps += 1;
  }

  graphics
    .poly([
      width * 0.12,
      horizon,
      width * 0.12,
      horizon - height * 0.16,
      width * 0.2,
      horizon - height * 0.22,
      width * 0.28,
      horizon - height * 0.16,
      width * 0.28,
      horizon,
    ])
    .fill(0x081428);
  graphics
    .poly([
      width * 0.76,
      horizon,
      width * 0.81,
      horizon - height * 0.2,
      width * 0.86,
      horizon,
    ])
    .fill(0x07101f);
}

function drawWater(graphics: Graphics, width: number, height: number): void {
  const top = height * 0.57;
  graphics.rect(0, top, width, height - top).fill(
    verticalGradient([
      { offset: 0, color: "#12325c" },
      { offset: 0.4, color: "#0b1e3a" },
      { offset: 1, color: "#050b14" },
    ]),
  );

  const strokes: Array<[number, number, number]> = [
    [0x3b8ef0, 0.4, 5],
    [0x2775ca, 0.32, 3],
    [0xf4c97a, 0.16, 2],
  ];
  strokes.forEach(([color, alpha, thickness], index) => {
    const y = top + height * (0.08 + index * 0.06);
    graphics.moveTo(-20, y);
    graphics.bezierCurveTo(
      width * 0.25,
      y - 28 + index * 10,
      width * 0.55,
      y + 36,
      width + 20,
      y + 8,
    );
    graphics.stroke({ width: thickness, color, alpha });
  });
}

function drawPlatform(graphics: Graphics, width: number, height: number): void {
  const cx = width * 0.32;
  const cy = height * 0.84;
  const rx = Math.min(width * 0.34, 560);
  const ry = Math.max(height * 0.055, 36);
  graphics.ellipse(cx, cy + 10, rx, ry).fill({ color: 0x050b14, alpha: 0.55 });
  graphics.ellipse(cx, cy, rx, ry).fill(
    new FillGradient({
      type: "radial",
      center: { x: 0.5, y: 0.5 },
      innerRadius: 0,
      outerRadius: 0.5,
      colorStops: [
        { offset: 0, color: "#4a5d78" },
        { offset: 0.45, color: "#1b2a3e" },
        { offset: 1, color: "#070d16" },
      ],
    }),
  );
  graphics
    .ellipse(cx, cy, rx, ry)
    .stroke({ width: 3, color: 0x3b8ef0, alpha: 0.35 });
  graphics
    .ellipse(cx, cy, rx * 0.72, ry * 0.58)
    .stroke({ width: 1.5, color: 0x9eb6d4, alpha: 0.28 });
  graphics.ellipse(cx, cy - 8, rx * 0.32, ry * 0.18).fill({
    color: 0x2775ca,
    alpha: 0.14,
  });
}

function drawHaze(graphics: Graphics, width: number, height: number): void {
  graphics.rect(0, height * 0.42, width, height * 0.28).fill(
    verticalGradient([
      { offset: 0, color: "#f4c97a00" },
      { offset: 0.5, color: "#e8a05a28" },
      { offset: 1, color: "#07111c00" },
    ]),
  );
}

function drawTrails(graphics: Graphics, width: number, height: number): void {
  const y = height * 0.6;
  graphics.moveTo(0, y);
  graphics.bezierCurveTo(
    width * 0.2,
    y - 30,
    width * 0.45,
    y + 40,
    width * 0.7,
    y - 10,
  );
  graphics.stroke({ width: 2, color: 0x3b8ef0, alpha: 0.28 });
  graphics.moveTo(width * 0.15, y + 36);
  graphics.bezierCurveTo(
    width * 0.4,
    y,
    width * 0.7,
    y + 50,
    width,
    y + 12,
  );
  graphics.stroke({ width: 1.5, color: 0x7ec8ff, alpha: 0.2 });
}

function armor(graphics: Graphics, color = 0xf4f7fa): Graphics {
  return graphics.fill(color);
}

function drawNovaRobot(graphics: Graphics, width: number, height: number): void {
  graphics.clear();
  const scale = Math.min(width, height);
  const cx = 0;
  const feetY = 0;
  const s = scale;

  const body = (x: number, y: number, w: number, h: number, r: number) => {
    graphics.roundRect(x, y, w, h, r);
    armor(graphics);
  };

  // legs
  body(cx - 0.09 * s, feetY - 0.28 * s, 0.07 * s, 0.28 * s, 0.032 * s);
  body(cx + 0.02 * s, feetY - 0.28 * s, 0.07 * s, 0.28 * s, 0.032 * s);
  graphics.circle(cx - 0.055 * s, feetY - 0.28 * s, 0.018 * s).fill(0x14151a);
  graphics.circle(cx + 0.055 * s, feetY - 0.28 * s, 0.018 * s).fill(0x14151a);
  graphics.circle(cx - 0.055 * s, feetY - 0.14 * s, 0.014 * s).fill(0x14151a);
  graphics.circle(cx + 0.055 * s, feetY - 0.14 * s, 0.014 * s).fill(0x14151a);

  // torso
  body(cx - 0.11 * s, feetY - 0.58 * s, 0.22 * s, 0.3 * s, 0.06 * s);
  graphics.circle(cx, feetY - 0.44 * s, 0.048 * s).fill(0x0b1a2e);
  graphics.circle(cx, feetY - 0.44 * s, 0.034 * s).fill(0x2775ca);
  graphics.circle(cx, feetY - 0.44 * s, 0.016 * s).fill(0x9bd0ff);

  // arms
  body(cx - 0.175 * s, feetY - 0.56 * s, 0.055 * s, 0.22 * s, 0.028 * s);
  body(cx + 0.12 * s, feetY - 0.56 * s, 0.055 * s, 0.22 * s, 0.028 * s);
  graphics.circle(cx - 0.148 * s, feetY - 0.56 * s, 0.024 * s).fill(0x14151a);
  graphics.circle(cx + 0.148 * s, feetY - 0.56 * s, 0.024 * s).fill(0x14151a);
  graphics.circle(cx - 0.148 * s, feetY - 0.56 * s, 0.009 * s).fill(0x3b8ef0);
  graphics.circle(cx + 0.148 * s, feetY - 0.56 * s, 0.009 * s).fill(0x3b8ef0);

  // head
  body(cx - 0.09 * s, feetY - 0.76 * s, 0.18 * s, 0.175 * s, 0.055 * s);
  graphics
    .roundRect(cx - 0.07 * s, feetY - 0.685 * s, 0.14 * s, 0.032 * s, 0.01 * s)
    .fill(0x0b1220);
  const ledW = 0.018 * s;
  const ledH = 0.016 * s;
  const leds = [-0.05, -0.025, 0, 0.025, 0.05];
  leds.forEach((offset, index) => {
    graphics
      .roundRect(
        cx + offset * s - ledW / 2,
        feetY - 0.678 * s,
        ledW,
        ledH,
        2,
      )
      .fill(index % 2 === 0 ? 0x3b8ef0 : 0x7ec8ff);
  });
  graphics
    .roundRect(cx - 0.012 * s, feetY - 0.8 * s, 0.024 * s, 0.045 * s, 0.008 * s)
    .fill(0x14151a);
  graphics.circle(cx, feetY - 0.805 * s, 0.012 * s).fill(0x3b8ef0);
}

const recipes: Record<string, (graphics: Graphics, width: number, height: number) => void> = {
  layer_sky_sunset: drawSky,
  layer_skyline: drawSkyline,
  layer_water_highways: drawWater,
  layer_platform: drawPlatform,
  layer_fog_haze: drawHaze,
  layer_light_trails: drawTrails,
  nova_idle_stand_3q: drawNovaRobot,
};

function navyFallback(graphics: Graphics, width: number, height: number): void {
  graphics.rect(0, 0, width, height).fill(0x0b1a2e);
}

function recipeFor(
  id: string,
): (graphics: Graphics, width: number, height: number) => void {
  return recipes[id] ?? navyFallback;
}

function layerSpecs(pack: DayScenePack): Array<{
  id: string;
  kind: LayerKind;
  depth: number;
}> {
  const fx = pack.layers.fx ?? [];
  const haze = fx.filter((id) => classifyFxSlot(id) === "haze");
  const trails = fx.filter((id) => classifyFxSlot(id) === "trails");
  const other = fx.filter((id) => classifyFxSlot(id) === "other");
  return [
    { id: pack.layers.sky, kind: "sky", depth: 0.08 },
    { id: pack.layers.far, kind: "far", depth: 0.18 },
    ...haze.map((id) => ({ id, kind: "fx" as const, depth: 0.12 })),
    { id: pack.layers.mid, kind: "mid", depth: 0.28 },
    ...trails.map((id) => ({ id, kind: "fx" as const, depth: 0.22 })),
    { id: pack.layers.near, kind: "near", depth: 0.4 },
    ...other.map((id) => ({ id, kind: "fx" as const, depth: 0.25 })),
  ];
}

async function trySprite(id: string): Promise<Sprite | null> {
  if (!assertCanon(id)) {
    return null;
  }
  const url = getAssetUrl(id);
  if (!url) {
    return null;
  }
  try {
    const texture = await Assets.load({ src: url, alias: id });
    return new Sprite(texture);
  } catch (error) {
    console.error(`[nova] failed to load canon asset ${id}`, error);
    return null;
  }
}

export async function mountHomeWorld(
  app: Application,
  pack: DayScenePack,
): Promise<HomeWorldHandle> {
  collectPackIds(listPackAssetIds(pack));

  const root = new Container();
  root.eventMode = "none";
  app.stage.eventMode = "none";
  app.stage.interactiveChildren = false;
  app.stage.addChild(root);

  const layers: Layer[] = [];
  for (const spec of layerSpecs(pack)) {
    const container = new Container();
    const graphics = new Graphics();
    container.addChild(graphics);
    const sprite = await trySprite(spec.id);
    if (sprite) {
      sprite.visible = true;
      graphics.visible = false;
      container.addChild(sprite);
    }
    root.addChild(container);
    layers.push({
      id: spec.id,
      kind: spec.kind,
      depth: spec.depth,
      container,
      graphics,
      sprite,
      recipe: recipeFor(spec.id),
    });
  }

  const novaContainer = new Container();
  const novaGraphics = new Graphics();
  novaContainer.addChild(novaGraphics);
  const novaId = pack.nova.spriteId ?? "nova_idle_stand_3q";
  const novaSprite = await trySprite(novaId);
  if (novaSprite) {
    novaSprite.anchor.set(0.5, 1);
    novaGraphics.visible = false;
    novaContainer.addChild(novaSprite);
  }
  root.addChild(novaContainer);

  const dust = new Container();
  const dustRng = mulberry32(0x51a7e);
  const motes = Array.from({ length: 18 }, () => {
    const mote = new Graphics();
    mote.circle(0, 0, 1.4 + dustRng() * 1.8).fill({
      color: 0x9bd0ff,
      alpha: 0.18 + dustRng() * 0.25,
    });
    dust.addChild(mote);
    return {
      graphic: mote,
      ox: dustRng(),
      oy: dustRng(),
      speed: 0.04 + dustRng() * 0.08,
    };
  });
  root.addChild(dust);

  let selected: ChoiceId | null = null;
  let phase: ScenePhase = "idle";
  let reducedMotion = false;
  let viewW = app.renderer.width;
  let viewH = app.renderer.height;

  const placeMotes = (elapsedMs = 0) => {
    const t = elapsedMs / 1000;
    motes.forEach((mote) => {
      const x = ((mote.ox + t * mote.speed) % 1) * viewW;
      const y =
        (mote.oy * 0.7 + 0.1) * viewH +
        Math.sin(t * mote.speed + mote.ox) * 12;
      mote.graphic.position.set(x, y);
    });
  };

  const applyReducedMotion = () => {
    dust.visible = !reducedMotion;
    if (reducedMotion) {
      for (const layer of layers) {
        layer.container.position.set(0, 0);
      }
      novaContainer.scale.set(1);
    }
  };

  const layout = (width: number, height: number) => {
    if (!isUsableViewSize(width, height)) {
      return;
    }
    viewW = width;
    viewH = height;
    for (const layer of layers) {
      if (layer.sprite) {
        layer.sprite.width = width;
        layer.sprite.height = height;
        layer.graphics.visible = false;
      } else {
        layer.graphics.visible = true;
        layer.graphics.clear();
        layer.recipe(layer.graphics, width, height);
      }
    }

    const portrait = height > width * 1.08;
    const novaScale = portrait
      ? Math.min(width * 0.9, height * 0.42)
      : Math.min(width * 0.42, height * 0.72);
    novaContainer.position.set(
      portrait ? width * 0.5 : width * 0.27,
      portrait ? height * 0.46 : height * 0.835,
    );
    if (novaSprite) {
      novaGraphics.visible = false;
      novaSprite.height = novaScale;
      novaSprite.scale.x = novaSprite.scale.y;
    } else {
      novaGraphics.visible = true;
      novaGraphics.clear();
      drawNovaRobot(novaGraphics, novaScale, novaScale);
    }
    if (!reducedMotion) {
      placeMotes(0);
    }
  };

  layout(viewW, viewH);
  applyReducedMotion();

  const handle: HomeWorldHandle = {
    layout,
    setSelected(id) {
      selected = id;
    },
    setPhase(next) {
      phase = next;
    },
    setReducedMotion(value) {
      reducedMotion = value;
      applyReducedMotion();
    },
    tick(elapsedMs) {
      if (reducedMotion) {
        applyReducedMotion();
        return;
      }
      const t = elapsedMs / 1000;
      const breathe = 1 + Math.sin(t * 2.1) * 0.012;
      const coreBoost = selected || phase !== "idle" ? 1.03 : 1;
      novaContainer.scale.set(breathe * coreBoost);
      for (const layer of layers) {
        layer.container.position.set(
          Math.sin(t * 0.22) * 14 * layer.depth,
          Math.cos(t * 0.17) * 6 * layer.depth,
        );
      }
      placeMotes(elapsedMs);
    },
    destroy() {
      root.destroy({ children: true });
    },
  };

  return handle;
}
