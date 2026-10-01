# Onboarding — region annotations for Eng

**Date:** 2026-09-28 · Europe/Istanbul  
**Frame:** `onboarding-target.png` (780×1688 = 390×844 @2× · **mobile portrait**)  
**Flow:** Connect → Disclaimer checkbox → (then Free10 toast on Home)  
**Copy source:** `../../ONBOARDING-EDGE-COPY.md` §B1  
**Look:** ART-DIRECTION-LOCK · same city family as Home/Vote

---

## Canvas

- Mobile-first portrait **~390 × 844** (safe-area aware). Frame is 2×.
- Thumb-reach primary CTA at bottom; chip/hero pattern from Home is **not** on this screen.
- Not landscape — do not mirror FINAL-HOME aspect.

---

## Z-order

1. Pixi full-bleed city (`scene_home_sunset_city` / textless master) ± dusk tint  
2. Soft readability scrim  
3. Pixi Nova (`nova_idle_stand_3q`) mid/lower-left  
4. DOM navy glass card (headline · body · disclaimer · checkbox · CTA)  
5. Footer micro + annotation legend (reference only)

Pointer hits: **DOM only**.

---

## Regions (`onboarding-target.png`)

| Region | Logical zone | Owner | Content / notes |
|--------|--------------|-------|-----------------|
| Scene underlay | Full viewport | Pixi | `scene-home-sunset-city-textless` · optional cooler dusk tint (no new plate) |
| Nova | Mid/lower-left · ~⅕ height | Pixi | `nova_idle_stand_3q` · peeks above/beside card · blue core + pixel visor |
| Headline | Upper card | DOM | **`Nova just woke up.`** · Fraunces |
| Body | Card | DOM | Architect **in-game** · daily Influence · Free daily / Extra optional (USDC) — EN from ONBOARDING-EDGE-COPY |
| Disclaimer block | Card | DOM | Full accept text (third-party on Arc · no guaranteed rewards · geo · not Circle Architects · not financial advice) |
| Checkbox | Card, above CTA | DOM | Required · **`I accept the rules above`** · error if CTA without check |
| Primary CTA | Card bottom · thumb-reach | DOM | **`Connect wallet`** · electric blue `#2775CA` / glow `#3B8EF0` · **no amber** |
| Wrong network (not in frame) | Overlay | DOM | **`Switch to Arc`** / Retry — same navy+blue tokens |
| Footer | Below card | DOM | **`Third-party on Arc · Not Circle Architects`** · no official logos |

---

## Pixi vs DOM

| Pixi | DOM |
|------|-----|
| Full-bleed sunset city plate (± dusk tint) | Navy glass card |
| Nova idle stand 3q | Headline · body · disclaimer copy |
| Soft VFX optional later | Checkbox · **Connect wallet** CTA · footer |

---

## Anti-slop (this frame)

- No Circle / Arc / USDC **official** logo marks  
- No amber CTA · no greenery added to plate  
- Architect = in-game title only  
- No APR / guaranteed-return language  

---

*Design · onboarding annotations · 2026-09-28 · Istanbul*
