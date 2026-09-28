# Nova — UI Rebuild BIND (Design → Eng)

**Status:** Design-owned rebuild ticket contract · complementary to `research/ai-build/client-bind-contract.md`  
**Do not delete** the Client bind doc — this is the rebuild claim packet.  
**Date:** 2026-09-28 · Europe/Istanbul  
**Locks:** ART-DIRECTION-LOCK · FINAL-HOME · UI-REBUILD-SPEC · WORKING-SET

---

## 1. Explicit removals (Eng must do)

| Remove | Why |
|--------|-----|
| Phase-1 **cream** HUD tokens (`#F7F3EB`, cream surfaces, charcoal-on-cream as default) | Superseded by navy glass |
| Phase-1 **amber** primary CTA / accent (`#D97706` as `--color-accent`) | Accent = electric blue |
| Cream bottom-nav as default chrome | FINAL-HOME = floating game HUD |
| Any Circle / Arc / USDC **official logo** components | Legal / lock |
| Merged Free+Extra influence bar | Product lock |
| Confetti / amber “success party” on Results | Calm settlement |

World gold `#F0B45A` may remain **only** as environment lighting token (`--color-world-gold`), never CTA.

---

## 2. Token CSS list (navy + blue) — ship these

```css
:root {
  --color-bg: #0B1220;
  --color-surface: rgba(10, 22, 44, 0.72);
  --color-border: #1E3A5F;
  --color-text: #FFFFFF;
  --color-text-muted: #A8B3C7;
  --color-accent: #2775CA;
  --color-accent-glow: #3B8EF0;
  --color-world-gold: #F0B45A; /* env only — NOT CTA */

  --font-story: Fraunces, "Source Serif Pro", Georgia, serif;
  --font-ui: "DM Sans", "IBM Plex Sans", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-pill: 999px;
}
```

Typography / spacing / motion: keep DESIGN-SYSTEM scales; ignore cream elevation shadows — use soft blue glow elevation per SPEC §E.

---

## 3. Asset id → WORKING-SET path map (P0 screens)

Paths relative to `design/reference/` unless noted. Manifest ids = Design snake_case (Client bind vocabulary).

### Scene / parallax

| Manifest id | File | Screens |
|-------------|------|---------|
| `scene_home_sunset_city` | `scene-home-sunset-city-textless.png` | Home · Vote* · Results* · Buy* · Confirm* |
| `layer_sky_sunset` | `parallax/layer-sky-sunset.png` | Home (+ others if parallax on) |
| `layer_skyline` | `parallax/layer-skyline.png` | Home |
| `layer_water_highways` | `parallax/layer-water-highways.png` | Home |
| `layer_platform` | `parallax/layer-platform.png` | Home |
| *(look lock only — not runtime plate)* | `FINAL-HOME.png` | Eng visual target; do not bake into app as HUD |

\* Vote / Results / Buy / Confirm: **reuse** `scene_home_sunset_city` + lighting tint until dedicated plates exist (SPEC §I).

### Nova

| Manifest id | File | Screens |
|-------------|------|---------|
| `nova_idle_stand_3q` | `nova-idle-stand-3q.png` | Home · Connect · Confirm |
| `nova_wave` | `nova-wave.png` | Vote · Onboarding |
| `nova_cheer` | `nova-cheer.png` | Results correct |
| `nova_soft_sad` | `nova-soft-sad.png` | Results miss |
| *(QA kit)* | `nova-character-sheet.png` | Not drawn in app |

### Tiles

| Manifest id | File | Screens |
|-------------|------|---------|
| `tile_stabilize` | `tiles/tile-stabilize.png` | Home · Vote |
| `tile_expand` | `tiles/tile-expand.png` | Home · Vote |
| `tile_route` | `tiles/tile-route.png` | Home · Vote |
| overlays | `tiles/ov-week1.md` | DOM copy keys (EN+TR notes) |

### HUD icons (SVG)

| Manifest id | File |
|-------------|------|
| `icon_day` | `hud/icon-day.svg` |
| `icon_free_influence` | `hud/icon-free-influence.svg` |
| `icon_extra_influence` | `hud/icon-extra-influence.svg` |
| `icon_usdc` | `hud/icon-usdc.svg` (generic $ · **not** official mark) |
| `icon_cast_influence` | `hud/icon-cast-influence.svg` |
| `icon_plus` | `hud/icon-plus.svg` |

### Buy

| Manifest id | File |
|-------------|------|
| `buy_pack_spark` | `buy/buy-pack-spark.png` |
| `buy_pack_pulse` | `buy/buy-pack-pulse.png` |

### VFX (soft · no confetti)

| Manifest id | File |
|-------------|------|
| `vfx_light_dust` | `vfx/vfx-light-dust.png` |
| `vfx_core_pulse` (+ f1–f3) | `vfx/vfx-core-pulse.png` … |
| `vfx_cta_glow` (+ f1, f3) | `vfx/vfx-cta-glow.png` … |

### Share (optional P0+)

See `share/` — Results / pre-vote cards; not required to claim rebuild HUD chrome.

### Annotated Eng targets (not runtime assets)

| File | Role |
|------|------|
| `reference/rebuild/home-target.png` | Annotated FINAL-HOME regions |
| `reference/rebuild/vote-target.png` | Composed Vote target |
| `reference/rebuild/layer-split.png` | Pixi vs DOM diagram |
| `reference/rebuild/HOME-VOTE-ANNOTATIONS.md` | Zone notes |

---

## 4. Concern → Pixi vs DOM

| Concern | Owner | Must not |
|---------|-------|----------|
| Selection A/B/C, cast click, numbers, strings | **DOM (React)** | Pixi as source of truth |
| Wallet connect, disclaimer, tutorial, toasts | **DOM** | Bake into plates |
| Buy packs UI, 90/8/2 breakdown, claim CTA | **DOM** | Duplicate fee math in Client |
| Pool / fee math | **`@nova/shared`** | Reimplement in UI |
| Parallax, Nova poses, scene tint, soft VFX | **Pixi** | Bake live copy into plates |
| Tile **art** textures | Pixi and/or `<img>` via manifest | Hardcoded URLs |
| Tile **labels / bodies** | **DOM** (+ Hikaye keys) | Bitmap text as SoT |
| Cast Influence button chrome | **DOM** (+ CSS glow / `vfx_cta_glow` optional) | Pixi-only unreadable CTA |
| Asset paths / hashes | **`@nova/assets` canon manifest** | `drafts/` in production |
| `/demo` thin page | **DOM** (navy+blue) | Circle marks · full game HUD required |

Layer diagram: `reference/rebuild/layer-split.png` · runtime API: `client-bind-contract.md` SceneStage / HudModel.

---

## 5. Manifest notes

1. App consumes **canon only** — drafts invisible to production builds.  
2. Prefer Design snake_case ids as public `id` (paths may be kebab under `packages/assets`).  
3. `artLockVersion` must match ART-DIRECTION-LOCK era; Eng CI fails on mismatch.  
4. Missing id → navy fallback + DEV error; **never** drop HUD.  
5. Day packs: default Home = home scene + stabilize/expand/route + `nova_idle_stand_3q` (see Client bind §2.1).  
6. Do **not** ship `FINAL-HOME.png` as a runtime texture for chrome — it is look-lock + annotation source.

---

## 6. Primary CTA copy (EN) — quick wire

| Screen | Primary |
|--------|---------|
| Connect | `Connect wallet` |
| Home / Vote | `Cast Influence` |
| Confirmation | `Back to Nova` |
| Results | `Claim {amount} USDC` |
| Buy | `Buy with USDC` |
| Tutorial | `Got it` |
| `/demo` | Connect / Buy (thin) — explorer links after |

Full edge copy: `design/ONBOARDING-EDGE-COPY.md` · Buy: `design/BUY-INFLUENCE-UX.md`.

---

## 7. `/demo` page (P1.5)

Per `eng/P1.5-GRANT-DEMO-SPEC.md` G-05:

- Thin connect → one Extra buy → show buy tx + Nova signal tx + explorer.
- **Still navy + blue tokens** from §2.
- **No** Circle / Arc official marks; plain text OK.
- Honesty framing: story + programmable USDC + one real agent spend — no full-AGI claim.
- Full floating game HUD **not** required; keep page thin.

---

## 8. Claim checklist (Eng)

- [ ] Cream/amber placeholder HUD tokens removed  
- [ ] Navy+blue CSS tokens live  
- [ ] Home matches `home-target.png` region intent  
- [ ] Vote matches `vote-target.png` region intent (tint reuse OK)  
- [ ] Pixi/DOM split per §4  
- [ ] WORKING-SET ids via canon manifest only  
- [ ] Free/Extra separate; Cast Influence blue CTA  
- [ ] `/demo` navy+blue, no Circle marks  
- [ ] Anti-slop checklist in UI-REBUILD-SPEC §H

---

*Design · UI-REBUILD-BIND · 2026-09-28 · Istanbul*
