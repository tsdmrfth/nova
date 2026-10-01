# Home + Vote — region annotations for Eng

**Date:** 2026-09-28 · Europe/Istanbul  
**Frames:** `home-target.png` · `vote-target.png` · `layer-split.png`  
**Logical canvas:** ~390 × 844 mobile-first (safe areas).  
**Home look-lock source:** `FINAL-HOME.png` at 1672×941 (landscape mock) — implement as **portrait game HUD** using the same region hierarchy.

---

## Shared z-order

1. Pixi full-bleed scene (city ± tint)  
2. Optional readability scrim  
3. DOM navy glass HUD  
4. Toast / tutorial / modal  

Pointer hits: **DOM only**. Pixi `eventMode = 'none'` by default.

---

## Home (`home-target.png`)

Source: annotated `FINAL-HOME.png` (original preserved).

| # | Region | Logical zone (portrait guide) | Owner | Assets / notes |
|---|--------|-------------------------------|-------|----------------|
| 1 | Day chip | Top row, leading | DOM | `icon_day` · `Day {n}` |
| 2 | Free Influence | Top row | DOM | `icon_free_influence` · never merge with Extra |
| 3 | Extra Influence | Top row | DOM | `icon_extra_influence` · `+` → Buy |
| 4 | USDC chip | Top row, trailing | DOM | `icon_usdc` plain $ · no official mark |
| 5 | Hero title + subline | Below chips, center band | DOM | Fraunces + DM Sans · EN |
| 6 | Nova | Mid-left, ~⅕–¼ height | Pixi | `nova_idle_stand_3q` · blue core + pixel visor |
| 7A–C | Choice tiles | Mid band, three columns | DOM + tile art | `tile_stabilize` / `expand` / `route` · selected = blue glow |
| 8 | Rank card | Bottom-leading | DOM | Architect **in-game** title + XP |
| 9 | Cast Influence | Bottom primary | DOM | Large blue glow CTA · `icon_cast_influence` optional |
| 10 | Disclaimer | Footer micro | DOM | Non-affiliation; no Circle logos |

**Pixi:** parallax or `scene_home_sunset_city` master + Nova + soft VFX.  
**DOM:** all chips, copy, tiles chrome, CTA, rank, disclaimer.

World gold appears **only** in the city lighting — not on CTA.

---

## Vote (`vote-target.png`)

Composed wire: `scene-home-sunset-city-textless` cover-crop + dusk tint + `nova-idle`/`wave` + tile thumbs + PIL navy HUD chrome.

| Region | Logical zone | Owner | Notes |
|--------|--------------|-------|-------|
| Top chips + **goal chip** | y ≈ safe-top … +64 | DOM | Day · MOST/LEAST/MIDDLE · Free · Extra · USDC |
| Hero copy | below chips | DOM | `Cast today's Influence` + spend hint |
| A/B/C tiles | mid, **prominent** | DOM + art | Same tile ids; selected outline `--color-accent-glow` |
| Influence spend | below tiles | DOM | Free/Extra split · stepper · cap line |
| Cast Influence | lower primary | DOM | **`CAST INFLUENCE`** blue pill |
| Buy link | under CTA | DOM | `Need more Extra Influence?` |
| Nova | lower-left behind HUD | Pixi | `nova_wave` preferred |
| City | full-bleed | Pixi | **Home plate + cooler dusk tint** OK (no new plate) |

---

## Pixel / logical mapping tips

- Design frames may be 2× or landscape; Eng should map **regions**, not absolute pixel clones of landscape FINAL-HOME.  
- Safe-area: keep chip row below notch; CTA above home indicator.  
- Content max width ~430 logical on wide viewports; scene still bleeds.  
- Tile hit targets ≥ 44×44 pt; Cast CTA min height 48–56.

---

## Layer split

See `layer-split.png` and `UI-REBUILD-BIND.md` §4. One-liner:

**React owns HUD + input; Pixi owns scene pixels; both address art via canon WORKING-SET ids.**

---


---

## Onboarding (`onboarding-target.png`)

Mobile portrait Connect frame (780×1688). Full region table + Pixi/DOM → **`ONBOARDING-ANNOTATIONS.md`**.

| Region | Owner | Notes |
|--------|-------|-------|
| City + dusk tint | Pixi | Same home plate family |
| Nova idle | Pixi | Mid/lower-left |
| Headline / body / checkbox / **Connect wallet** | DOM | Navy glass · blue CTA · EN from ONBOARDING-EDGE-COPY |
| Footer | DOM | `Third-party on Arc · Not Circle Architects` |


*Design · rebuild annotations · 2026-09-28*
