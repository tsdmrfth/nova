# Nova — Coded Home UI Style Guide (Eng implementation)

**Status:** AUTHORITATIVE fine-detail for matching the coded Home look  
**Owner:** Nova · Design  
**Audience:** Eng (read end-to-end before polishing HUD CSS)  
**Date:** 2026-09-29 · Europe/Istanbul  
**Source of truth for this doc:** user-supplied coded screenshot `design/reference/rebuild/eng-home-coded.png` (3840×2222)  
**Color/layout samples:** `design/reference/rebuild/_eng-screenshot-samples.json`  
**Locks (higher wins on product bans):** `ART-DIRECTION-LOCK.md` · `UI-REBUILD-SPEC.md` · this file (chrome micro-detail)  
**Background plate (city + Nova, no UI):** see §11

---

## 0. One-sentence thesis

Floating **navy glassmorphism HUD** (translucent deep navy + thin luminous blue border + backdrop blur) over a **full-bleed cinematic sunset city** with **Nova baked into the background plate** (or Pixi-composited identically). Accent is **electric USDC blue** only — never amber/cream.

---

## 1. Layer model (do not flatten)

| Z (back → front) | Layer | Implementation |
|------------------|-------|----------------|
| 0 | App underlay | `#081329` solid (letterbox / load · sampled) |
| 1 | **Background plate** | Single PNG: city + Nova (+ platform). See §11. Pixi sprite cover-crop OR CSS `background-size: cover` |
| 2 | Optional readability scrim | Very soft vertical vignette / bottom darken only if copy fails WCAG — max ~12% black, never cream wash |
| 3 | Floating HUD chips + MENU | DOM glass pills |
| 4 | Bottom cast chrome (stepper + Cast CTA + disclaimer) | DOM — visible when tutorial closed |
| 5 | Tutorial / modal overlay | DOM denser glass + dimmer behind |
| 6 | Safe-area insets | System |

**Hard rule:** HUD never “bakes” into the background PNG. Background has **zero** text, chips, buttons, or glass panels.

**Pointer:** DOM only. Pixi `eventMode = 'none'` unless Eng explicitly needs scene picks (default: none).

---

## 2. Canvas & responsive framing

| Mode | Logical | Notes |
|------|---------|-------|
| **Ship default** | Portrait ~**390 × 844** | Mobile-first; CTA in thumb zone |
| Coded reference | Landscape **3840 × 2222** (~16:9) | Look/feel lock for glass chrome; do **not** ship desktop-first layout |
| Wide desktop | Center column max ~**430** logical | Scene still full-bleed behind |

**Background fit:** `object-fit: cover` / Pixi cover. Anchor: keep **Nova’s torso + head** in the safe mid-left; prefer cropping sky/sides over cropping Nova’s core/visor.

Safe-area: chip row below notch; Cast CTA above home indicator (≥8–12px gap).

---

## 3. Color tokens (sampled + locked)

Sampled from `eng-home-coded.png` where noted; locked family from ART-DIRECTION / SPEC.

| Token | Value | Role |
|-------|-------|------|
| `--color-bg` | `#081329` | Underlay (sampled coded frame edge) |
| `--color-surface` | `rgba(14, 23, 43, 0.72)` ≈ `#0E172B` @ 72% | Glass panel fill (sampled modal) |
| `--color-surface-chip` | `rgba(38, 42, 53, 0.78)` ≈ `#262A35` @ 78% | Top chips (sampled denser than modal) |
| `--color-surface-dense` | `rgba(14, 23, 43, 0.88)` | Tutorial modal / nested rule cards |
| `--color-border` | `#25395C` | Hairline luminous edge (1px · sampled) |
| `--color-border-soft` | `rgba(59, 142, 240, 0.35)` | Selected / focus ring optional |
| `--color-text` | `#FFFFFF` | Primary |
| `--color-text-muted` | `#A2A4A8` | Secondary / body on glass (sampled) |
| `--color-accent` | `#2775CA` | Brand accent (USDC blue · lock) |
| `--color-accent-glow` | `#3B8EF0` | Glow / hover target |
| `--color-accent-cta` | `#4880D6` | **Sampled** GOT IT fill — live CTA; hover → `#3B8EF0`; pressed → `#2775CA` |
| `--color-link` | `#528CE9` | Text link (“Skip”) on navy (sampled) |
| `--color-world-gold` | `#F0B45A` | **Environment only** (sunset) — never CTA |
| `--color-scrim` | `rgba(5, 10, 20, 0.45)` | Behind modal |

**Banned on rebuild screens:** cream `#F7F3EB`, amber CTA `#D97706`, purple neon void, official Circle/Arc/USDC marks.

**Chrome rules**
- Elevation = soft **blue outer glow**, not drop-shadow cream cards.
- Glass always reads darker than the city; if city is bright sunset, raise surface alpha rather than switching to cream.
- Text on accent CTA = **white**.

---

## 3b. Layout geometry (from coded 3840×2222)

| Region | Approx |
|--------|--------|
| Chip row Y | ~4.7% from top |
| Tutorial modal | ~22% × 43% of canvas, centered (~50%, 52%) |
| Modal corner feel | ~44–48px on this resolution → scale to `--radius-lg` 16 logical on 390-wide |
| CTA / chips | Pill-shaped (`--radius-pill`) |
| Bottom cast band Y | ~65% from top (landscape ref); on portrait push into thumb zone lower third |

Map **percentages**, not raw 4K pixels, when implementing portrait.

---

## 4. Glass material (exact recipe)

Apply to chips, MENU, tutorial modal, nested rule cards, bottom Cast button (when translucent variant), stepper shell:

```css
.nova-glass {
  background: var(--color-surface);           /* rgba(14,23,43,0.72) */
  border: 1px solid var(--color-border);      /* #25395C */
  border-radius: var(--radius-md);            /* 12px — cards */
  backdrop-filter: blur(16px) saturate(1.2);
  -webkit-backdrop-filter: blur(16px) saturate(1.2);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),  /* top specular */
    0 8px 32px rgba(0, 0, 0, 0.35);           /* depth into scene */
}
```

| Variant | Radius | Blur | Notes |
|---------|--------|------|-------|
| Chip / MENU pill | `--radius-pill` (999) | 12–16px | Compact height ~36–40 logical |
| Modal / large card | `--radius-lg` (16) | 16–20px | Dense surface OK |
| Nested rule row | `--radius-md` (12) | inherit parent or 8px | 1px border, slightly lighter/darker than parent |
| Primary CTA solid | `--radius-pill` or 14–16 | none required | Filled accent, not glass |

**Do not:** frosted white glass, heavy white borders, 0-blur opaque navy slabs that look like solid cards, multi-color gradients on glass fills.

---

## 5. Typography

| Role | Family | Weight | Size / line (logical) | Color |
|------|--------|--------|----------------------|-------|
| Story / display | **Fraunces** | 600–700 | Title ~22–28 / 28–34 | `#FFF` |
| Story eyebrow | Fraunces | 500 | ~14–16 / 20 | `#A8B3C7` or soft white |
| UI body | **DM Sans** | 400–500 | 14–16 / 20–24 | `#FFF` / muted |
| Labels / chips | DM Sans | 500–600 | 11–13 / 14–16 · tracking slightly wide OK | `#FFF` |
| Micro / mono | **IBM Plex Mono** | 400 | 11 / 14 | muted |
| CTA label | DM Sans | 600–700 | 15–17 / 20 · uppercase or title case per copy lock | `#FFF` |

Coded screenshot pattern on tutorial:
- Eyebrow: “First light” — small serif, muted
- H1: “How today works” — large bold serif, white
- Body / rule cards: sans, white, comfortable leading
- CTA: “GOT IT >” — bold sans, white on blue
- Skip: sans link, accent-tint blue

**No Inter-only.** EN-first UI copy.

---

## 6. Spacing / radius / tap

Spacing (4-based): 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48.

| Element | Spec |
|---------|------|
| Screen horizontal inset | 16 (chip row may 12–16) |
| Chip gap | 8–12 |
| Modal horizontal inset | ~16–24; modal width ~ min(100%−32, 420) on portrait · ~42–48% width on wide coded ref |
| Nested card stack gap | 8–12 |
| CTA min height | **48–56** logical |
| Chip min height | **36–40** |
| Icon in chip | 16–18 + 6–8 gap to label |
| Thumb zone | lower ~28–35% of viewport for primary Cast |

Radius: sm 8 · md 12 · lg 16 · pill 999.

---

## 7. Component inventory (coded Home + tutorial)

### 7.1 Top chip row

Horizontal floating pills, top-center / top-spread under safe-area:

| Chip | Content pattern | Icon |
|------|-----------------|------|
| Day | `DAY 01` (or `Day {n}`) | calendar |
| Goal | `DAY GOAL` + `MOST`/`LEAST`/`MIDDLE` | target |
| Free Influence | `FREE INFLUENCE` + `{n}` | cube / influence |
| Extra Influence | `EXTRA INFLUENCE` + `{n}` + optional `+` | influence · `+` opens Buy |
| USDC (optional separate) | plain `USDC` text | generic $ — **no official mark** |

**Rules:** Free and Extra **never merged**. Capsules use `.nova-glass` + pill radius. Label uppercase micro + value emphasis OK.

### 7.2 MENU

Trailing top pill: label `MENU`. Same glass as chips. Opens sheet/drawer (product); chrome stays navy glass.

### 7.3 Tutorial modal (“How today works”)

Centered glass card over dimmed scene:

1. Eyebrow (Fraunces) — e.g. `First light`
2. Title (Fraunces bold) — e.g. `How today works`
3. **3 nested glass rule cards** (bordered, stacked) — short EN bullets (goal / free influence / cast)
4. Primary CTA — solid accent pill: **`GOT IT >`** (chevron allowed as typography or icon)
5. Secondary — text button **`Skip`** (`--color-link`), no box

Behind modal: `--color-scrim` full-bleed. Modal must not use cream paper.

### 7.4 Bottom cast chrome (Home / Vote)

Visible when tutorial dismissed (still partially visible behind modal in coded shot):

| Element | Spec |
|---------|------|
| Label | `EXTRA TO CAST` (micro, muted) |
| Stepper | `−` · value · `+` in glass or ghost buttons; Free/Extra **split** per SPEC (do not merge meters) |
| Primary CTA | Wide translucent-to-solid blue pill: **`CAST INFLUENCE >`** |
| Footer | Centered micro disclaimer: Influence non-binding / outcomes shape world — muted |

Cast CTA elevation:

```css
.nova-cta-primary {
  background: linear-gradient(180deg, #3B8EF0 0%, #2775CA 100%);
  /* or flat #4880D6 matching coded sample */
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  box-shadow:
    0 0 24px rgba(59, 142, 240, 0.45),
    0 0 48px rgba(39, 117, 202, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  min-height: 52px;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.nova-cta-primary:disabled {
  opacity: 0.4;
  box-shadow: none;
}
```

### 7.5 States

| Control | States |
|---------|--------|
| Chips | default · (Extra `+` hover) |
| Cast / Got it | default · hover (brighter glow) · pressed (deeper `#2775CA`) · disabled |
| Skip | default · hover underline/opacity |
| Stepper | enabled · at 0 (minus disabled) · at cap (plus disabled) |
| Tiles (when on Home/Vote) | default · selected (blue glow ring) · disabled |

---

## 8. Motion

| Token | Value | Use |
|-------|-------|-----|
| Fast | ~120–160ms | Press / chip |
| Base | ~200–240ms | Modal open/close, Skip |
| Slow | ~320–400ms | Scene fade / Nova pose swap |

Easing: standard ease-out. **Reduced motion:** cut glow pulses and parallax drift; keep opacity fades.

**Banned:** confetti, bounce loops, amber “success party”.

---

## 9. Iconography

- Stroke / glyphs: light electric blue or white on navy glass.
- Size in chips: 16–18px.
- HUD icons from WORKING-SET `hud/*.svg` (generic USDC `$` only).
- Chevron on CTA: optional trailing `>` in label or 16px icon — match coded “GOT IT >” / “CAST INFLUENCE >”.

---

## 10. Anti-slop checklist (Eng QA)

- [ ] No cream panels, amber CTA, Inter-only stack  
- [ ] Free / Extra separate  
- [ ] No official Circle / Arc / USDC logos  
- [ ] Background PNG has **no** HUD baked in  
- [ ] Glass uses blur + `#0E172B`-family fill + `#25395C` border (chips may use `#262A35`)  
- [ ] Cast / Got it = electric blue glow, white label  
- [ ] Fraunces for story titles; DM Sans for UI  
- [ ] Portrait mobile-first; landscape screenshot is chrome reference only  
- [ ] Nova: white armor, black joints, blue core, pixel sunglasses (not meme sticker)  
- [ ] No greenery in scene  

---

## 11. Background plate (city + Nova)

User directive (2026-09-29): city + Nova from the Home screen may ship as **one background image**; HUD stays DOM on top.

| File | Size | Use |
|------|------|-----|
| `design/reference/scene/home-bg-city-nova.png` | 1920×1080 | **Primary** underlay — **FINAL-HOME** white archipelago + Nova idle (not dark megacity) |
| `design/reference/rebuild/home-bg-city-nova-landscape.png` | 1672×941 | Rebuild copy of the stripped FINAL-HOME strip (same bytes as `home-bg-from-final-home.png`, not the 1920 runtime plate) |
| `design/reference/rebuild/home-bg-city-nova-portrait.png` | 780×1688 | Portrait cover crop (~9:16) for mobile targets |
| `design/reference/rebuild/home-bg-from-final-home.png` | 1672×941 | Stripped FINAL-HOME look-lock — **do not** ship as runtime BG |
| `design/reference/rebuild/home-bg-city-nova-PREV-dark-megacity.png` | 1920×1080 | Rejected dark megacity archive — **do not** use as runtime |
| `design/reference/rebuild/eng-home-coded.png` | 3840×2222 | Coded HUD reference only — **do not** ship as runtime BG |

**Canon commit (Eng):**

| From Design | To `packages/assets/canon/` |
|-------------|----------------------------|
| `design/reference/scene/home-bg-city-nova.png` | `scene/home-bg-city-nova.png` (new id `scene_home_bg_city_nova`) |

**Runtime preference**
1. Prefer single plate `scene_home_bg_city_nova` for Home underlay (fast path).  
2. Optional advanced: parallax layers + separate Nova sprites from WORKING-SET (idle/wave/cheer/soft_sad) — still valid per BIND §9.  
3. Do **not** use `eng-home-coded.png` as the plate (HUD baked in).

**Pose on plate:** Nova idle (standing, arms at sides), blue chest core, pixel visor, white archipelago, metal platform — matches FINAL-HOME. Not the rejected dark megacity.

---

## 12. Relationship to other Design docs

| Doc | Relationship |
|-----|----------------|
| `ART-DIRECTION-LOCK.md` | Visual thesis / bans — still wins |
| `UI-REBUILD-SPEC.md` | Screen wires, tokens, Free/Extra product rules |
| `UI-REBUILD-BIND.md` | Asset commit map + Pixi/DOM — **§ updated for this plate** |
| `WORKING-SET.md` | Layered art still valid; this plate is additive shortcut |
| `reference/rebuild/home-target.png` | Earlier annotated target — chrome should converge toward **this** style guide + coded shot |

---

## 13. Eng copy anchors (EN)

Use product copy sources for final strings; coded shot examples:

- Tutorial eyebrow / title: `First light` / `How today works`  
- Primary tutorial CTA: `Got it` (trailing chevron OK)  
- Secondary: `Skip`  
- Home/Vote primary: `Cast Influence` (trailing chevron OK)  
- Stepper label: `Extra to cast`  
- Confirmation primary (separate screen): **`Back to Nova`** per P1 follow-up  

---

**End.** Questions on gaps → Nova · Design. No Flux batch implied by this plate beyond the saved PNGs above.
