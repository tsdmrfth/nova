# Nova — UI Rebuild BIND (Design → Eng)

> **Superseded for chrome (2026-10-02):** tokens, type, layout and screen structure now come from [`UI-KIT-V2.md`](UI-KIT-V2.md). Product locks in this doc still apply.

**Status:** Design-owned rebuild ticket contract · complementary to `research/ai-build/client-bind-contract.md`  
**Do not delete** the Client bind doc — this is the rebuild claim packet.  
**Date:** 2026-09-28 · Europe/Istanbul · **Updated:** 2026-09-29 (PR #10 follow-up commit map)  
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
| `nova_idle_stand_front` | `nova-idle-stand-front.webp` (+ `.png`) | Layered / sprite alt · user drop 2026-09-29 |
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

---

## 9. PR #10 follow-up — Eng must **commit** these photographic plates

**Source root (box / Design truth):** `/workspace/nova/design/reference/`  
**Dest root (repo checkout):** `packages/assets/canon/`  
**Action:** Replace current **SVG placeholders** with these **PNGs**. Update `packages/assets/canon/manifest.json` paths (`.svg` → `.png`), recompute `sha256`, set `license` to `internal-working-set` (or Design approved). **No Flux/MJ batch** — all required plates exist below.

### 9.1 Must-commit for real Nova + city (Home / Vote / Confirm / Results / Buy / Onboarding)

| Manifest id | Copy FROM (Design) | Commit TO (repo) | Notes |
|-------------|--------------------|------------------|-------|
| `scene_home_sunset_city` | `design/reference/scene-home-sunset-city-textless.png` | `packages/assets/canon/scene/scene-home-sunset-city.png` | Rename drop `-textless`; keep id |
| `layer_sky_sunset` | `design/reference/parallax/layer-sky-sunset.png` | `packages/assets/canon/scene/layer-sky-sunset.png` | |
| `layer_skyline` | `design/reference/parallax/layer-skyline.png` | `packages/assets/canon/scene/layer-skyline.png` | |
| `layer_water_highways` | `design/reference/parallax/layer-water-highways.png` | `packages/assets/canon/scene/layer-water-highways.png` | |
| `layer_platform` | `design/reference/parallax/layer-platform.png` | `packages/assets/canon/scene/layer-platform.png` | |
| `nova_idle_stand_3q` | `design/reference/nova-idle-stand-3q.png` | `packages/assets/canon/character/nova-idle-stand-3q.png` | Primary Home/Connect |
| `nova_wave` | `design/reference/nova-wave.png` | `packages/assets/canon/character/nova-wave.png` | **Add** to manifest (not in PR #10 yet) |
| `nova_cheer` | `design/reference/nova-cheer.png` | `packages/assets/canon/character/nova-cheer.png` | **Add** · Results correct |
| `nova_soft_sad` | `design/reference/nova-soft-sad.png` | `packages/assets/canon/character/nova-soft-sad.png` | **Add** · Results miss |
| `tile_stabilize` | `design/reference/tiles/tile-stabilize.png` | `packages/assets/canon/tiles/tile-stabilize.png` | |
| `tile_expand` | `design/reference/tiles/tile-expand.png` | `packages/assets/canon/tiles/tile-expand.png` | |
| `tile_route` | `design/reference/tiles/tile-route.png` | `packages/assets/canon/tiles/tile-route.png` | |
| `pack_spark` | `design/reference/buy/buy-pack-spark.png` | `packages/assets/canon/packs/buy-pack-spark.png` | Prefer `packs/` over `hud/pack-spark.svg` |
| `pack_pulse` | `design/reference/buy/buy-pack-pulse.png` | `packages/assets/canon/packs/buy-pack-pulse.png` | |
| `badge_winner` | `design/reference/share/results-winner-badge.png` | `packages/assets/canon/hud/badge-winner.png` | Or `share/` — update manifest path |

**Delete or stop shipping (after PNG live):** matching `.svg` placeholders under `canon/scene/`, `canon/character/`, `canon/tiles/`, `canon/hud/pack-*.svg`.

**Optional soft VFX (not blocking silhouette fix):**  
`design/reference/vfx/vfx-light-dust.png` → `packages/assets/canon/vfx/vfx-light-dust.png` (+ core-pulse / cta-glow frames if Eng binds them).

**Do not commit as runtime chrome:** `FINAL-HOME.png`, `nova-character-sheet.png`, `reference/rebuild/*-target.png` (look-lock / annotation only).

### 9.2 Source SHA-256 (verify after copy · 2026-09-29)

| File | sha256 |
|------|--------|
| `scene-home-sunset-city-textless.png` | `7284bbc5b7efac015b2e81e08490791639d8ad12c315204f9af51eeeb1726acc` |
| `layer-sky-sunset.png` | `ec102c0f0d9c060d25b2d7e1bbb2831feed41c8be4294e24ff6e3a8cd75fecf9` |
| `layer-skyline.png` | `6a088a296f959b2c175ce1766fff72c2a492b85b28543175ca845ab24052bfdd` |
| `layer-water-highways.png` | `33c21a6e71e05c3a5c59205c8e8571f5617072b8bbccbd62792aaa29511c8ab4` |
| `layer-platform.png` | `5892c3edc06359b2e8ccb4d99a2ff3770b35b2ad4f37bc20a5e21790c8f99c17` |
| `nova-idle-stand-3q.png` | `998e644f3fdf7bdd9a4aa1c67371bb13623e6df4e8b07834f03b30aa0b694a12` |
| `nova-wave.png` | `d610da429903e922a9dfc6e6a252e9299cdc5cb1a7bd429e9a719598187abde9` |
| `nova-cheer.png` | `46581286749e6c96987a79f440d1a73b81266e74a8789834132e82554adb1eb8` |
| `nova-soft-sad.png` | `51df679d398f6a2e97ad1980d95f85857ce639e63cd580e70b1364ce804b39a0` |
| `tile-stabilize.png` | `18e05af64a6bc72d214a37ddeb66dbf392deb54c48e1f181e3ba5052ae4f0cc9` |
| `tile-expand.png` | `b0808bf696ae8637a73c12215ba844448b9a9cc6bb350836720c2861ab6adda0` |
| `tile-route.png` | `517174d69ccbca1fc974ffecef0e29fea6494846d2a4855ee1cb4826b1432b97` |
| `buy-pack-spark.png` | `143298fe58ab5fb8be910ff6e29b38f438a29e4d3d4da9c523027e0adb906c05` |
| `buy-pack-pulse.png` | `ea8abd71895896d0a00a927c19f8aeb96ae9897292058706fd69a1987d25a49c` |
| `results-winner-badge.png` | `e3d8a8d5e51deecfe771f441b1738d9760060f1d0ad874ec1012b568cdd3f80b` |

---

## 10. PR #10 follow-up — gap table (Design)

| # | Gap | Owner | Status | Flux needed? |
|---|-----|-------|--------|--------------|
| 1 | Photographic Nova + city (silhouette / SVG placeholders) | **Eng** commit §9.1 PNGs + remanifest | OPEN | **No** — WORKING-SET present |
| 2 | Vote **Free/Extra spend split stepper** (SPEC G3 · vote-target) | **Eng** DOM | OPEN | No |
| 3 | Confirmation primary CTA **`Back to Nova`** (SPEC G4 / BIND §6) | **Eng** DOM wire | OPEN | No |
| 4 | `nova_wave` / `nova_cheer` / `nova_soft_sad` not in canon manifest | **Eng** add paths §9.1 | OPEN | **No** |
| 5 | `layer_light_trails` / `layer_fog_haze` photographic | Optional | Soft | **Gap name only** — no WORKING-SET plates; keep SVG or omit; DOM/Pixi tint OK |
| 6 | `tile_selected_glow_frame` bitmap | Optional | Soft | **Gap name only** — CSS glow OK per PR residual |
| 7 | Dedicated vote/results/buy scene plates | Design later | Soft | No for this ticket — home plate + tint |

**Eng claim packet for follow-up:** this BIND §9–§10 + `UI-REBUILD-SPEC` G3/G4 + `reference/rebuild/vote-target.png`.

---

---

## 11. Home composite BG plate (city + Nova) — 2026-09-29 user ask

**Style chrome bible:** `design/UI-HOME-CODED-STYLE.md` (fine detail from coded Home screenshot).  
**Coded HUD reference (do not ship as BG):** `design/reference/rebuild/eng-home-coded.png`

User: city + Nova may be **one** background image; HUD stays DOM.

**2026-09-29 user drop (final plate):** User-supplied HUD-less white archipelago + Nova idle (left). Converted to **WebP** for design/runtime; PNG masters kept for remanifest parity. Prior interim gen archived as `rebuild/home-bg-city-nova-PREV-interim-09e0620.png`.

| Manifest id | FROM (Design) | TO (repo) | Notes |
|-------------|---------------|-----------|-------|
| `scene_home_bg_city_nova` | `design/reference/scene/home-bg-city-nova.webp` (1672×941) · PNG master same stem | `packages/assets/canon/scene/home-bg-city-nova.webp` (or `.png`) | **Primary** underlay; cover-crop |
| *(portrait target only)* | `design/reference/rebuild/home-bg-city-nova-portrait.webp` (780×1688) | optional portrait stem | Mobile art target; or cover-crop landscape |
| `nova_idle_stand_front` | `design/reference/nova-idle-stand-front.webp` (1024×1536 RGBA) | `packages/assets/canon/character/nova-idle-stand-front.webp` | User front Nova on black; layered / sprite |
| `nova_idle_stand_front_cutout` | `design/reference/nova-idle-stand-front-cutout.webp` | same under `character/` | Near-black → alpha helper for Pixi |

**SHA-256**
| File | sha256 |
|------|--------|
| `scene/home-bg-city-nova.webp` | `1a49f4ba2ec5441c420391b59f295621fce607b94eba85d9906788a65eb42dec` |
| `scene/home-bg-city-nova.png` | `4359ce21cf7b5ecb9206c4891bb46fdf047f20443605a805857680a803432b40` |
| `rebuild/home-bg-city-nova-portrait.webp` | `c2e8c56f278c08913f1da7f1a2deee3f2f596d04441baae8973a7364653e9c11` |
| `rebuild/home-bg-city-nova-portrait.png` | `396db67f650e7afcebb286c45b7293a3b4d2ad256b80338ec0d0cd6e10f48bbf` |
| `nova-idle-stand-front.webp` | `b8b6513cb395104bcac35675d6c791e5b61876091357dae376ebdc1811e3bf34` |
| `nova-idle-stand-front.png` | `52248d0999529c5a489f20fe1238aaa049830cb2ebb7691cc8fc9f53ac766bf9` |
| `nova-idle-stand-front-cutout.webp` | `2c049f71b5dd5bbe75729a73282c68a36b729eeac60e38d4144c606ffd8a9cb2` |

**Runtime:** Prefer WebP composite `scene_home_bg_city_nova` for Home fast path. Do not stack `nova_idle_stand_front` on that plate (Nova is already in the image). Cutout is for a separate layered path only. §9.1 idle/wave/cheer sprites remain for other screens. Never use `eng-home-coded.png` or `FINAL-HOME.png` as a runtime plate.

---

*Design · UI-REBUILD-BIND · updated 2026-09-29 (user WebP plate + front Nova) · Istanbul*

