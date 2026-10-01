# Nova — Full UI Rebuild SPEC

> **Superseded for chrome (2026-10-02):** tokens, type, layout and screen structure now come from [`UI-KIT-V2.md`](UI-KIT-V2.md). Product locks in this doc still apply.

**Status:** AUTHORITATIVE for rebuild · CEO GO 2026-09-28  
**Owner:** Nova · Design  
**Audience:** CEO glance → Eng claim  
**Mode:** Token-lean — reuse WORKING-SET; annotated targets only (no Flux/MJ batch)  
**Date:** 2026-09-28 · Europe/Istanbul

---

## A. Purpose & locks

### Purpose
Replace the Phase-1 **placeholder cream/amber HUD** with the locked **navy glass + electric blue** game HUD over a full-bleed Pixi sunset-city scene. Scope = soft-launch path screens + thin `/demo` grant page.

### Locks (read in this order — higher wins conflicts)

| Rank | Doc / asset | Role |
|------|-------------|------|
| 1 | `design/ART-DIRECTION-LOCK.md` | Visual thesis, accent, world bans |
| 2 | `design/reference/FINAL-HOME.png` | Canonical look lock (full HUD mock) |
| 3 | **This SPEC** (`UI-REBUILD-SPEC.md`) | Rebuild layout, tokens, screens, Eng claim |
| 4 | `design/reference/WORKING-SET.md` | Canon P0 art ids / files to reuse |
| 5 | `design/UI-REBUILD-BIND.md` | Asset map + Pixi/DOM table for Eng |
| 6 | `research/ai-build/client-bind-contract.md` | Runtime SceneStage / HudModel (keep; complementary) |

### Legacy override (explicit)

`DESIGN-SYSTEM.md` and `DO-DONT.md` still contain **legacy cream/amber** sections (bottom-nav SaaS pattern, amber CTA, cream cards). For this rebuild:

- **This SPEC + ART-DIRECTION-LOCK win.**
- Cream/amber UI is **banned** on all rebuild screens.
- Keep from DESIGN-SYSTEM: Fraunces + DM Sans + IBM Plex Mono; 4-based spacing; radius scale; motion tokens; reduced-motion.
- Discard for rebuild: cream base, amber primary, Inter-only, cream bottom tabs as default chrome.

### Non-goals
- Do not regenerate character/scene Flux batches.
- Do not edit `ART-DIRECTION-LOCK.md` or `FINAL-HOME.png`.
- Do not ship official Circle / Arc / USDC logo marks.
- Do not write app code in this Design pack.

---

## B. Layout system

### Canvas
- **HARD RULE (user 2026-09-28):** Every rebuild screen is **mobile-first portrait**. Logical canvas ~**390 × 844** (safe-area top/bottom). Annotated Eng targets under `reference/rebuild/` ship as portrait frames (2× 780×1688 OK). Landscape comps are look-lock / mood only — not ship layout.
- Primary CTA in **thumb zone** (lower third); chips stay top; copy/tiles stack vertically with comfortable tap targets (≥48px).
- Desktop / wide: center column max content width **~430 logical**; scene still full-bleed behind — **do not** redesign as desktop-first.
- Annotated Home reference (`FINAL-HOME.png`) is a **landscape art lock**; Eng still implements **portrait game HUD** zones per §G + `reference/rebuild/*-ANNOTATIONS.md`. Prefer portrait `home-target` / future screens over landscape for layout.

### Structure (game HUD — prefer over cream SaaS)
```
┌─────────────────────────────────────┐
│  safe-area top                      │
│  floating navy glass chips (DOM)    │
│                                     │
│     ┌─────────────────────────┐     │
│     │  full-bleed Pixi scene  │     │
│     │  (city + Nova + VFX)    │     │
│     └─────────────────────────┘     │
│  hero copy (DOM)                    │
│  A/B/C tiles (DOM + tile art)       │
│  Cast Influence / primary CTA       │
│  footer disclaimer (DOM)            │
│  safe-area bottom                   │
└─────────────────────────────────────┘
```

### Z-order (back → front)
1. Pixi `Application` canvas (full viewport)
2. Optional soft vignette / gradient scrim (DOM or Pixi, low opacity — readability only)
3. React HUD panels / chips / tiles / CTA
4. Modals, toast, tutorial overlay
5. System safe-area insets

### Patterns
- **Prefer:** floating navy glass HUD over city (FINAL-HOME).
- **Avoid:** DESIGN-SYSTEM §9 cream bottom-nav as default chrome if it fights FINAL-HOME.
- Light glass **dock** only if Eng needs persistent cross-screen entry (Nova / Profile) — still navy+blue glass, never cream tabs.
- Content horizontal padding: `--space-4` (16); chip row may go edge-aware with 12–16 inset.

---

## C. Color / HUD chrome tokens (navy + blue only)

| Token | Value | Use |
|-------|-------|-----|
| `--color-bg` | `#0B1220` | App underlay / fallback |
| `--color-surface` | `rgba(10, 22, 44, 0.72)` | Glass panels |
| `--color-border` | `#1E3A5F` | Thin luminous edges |
| `--color-text` | `#FFFFFF` | Primary |
| `--color-text-muted` | `#A8B3C7` | Secondary / hints |
| `--color-accent` | `#2775CA` | Primary accent (USDC blue) |
| `--color-accent-glow` | `#3B8EF0` | CTA / core / selected glow |
| `--color-world-gold` | `#F0B45A` | **Environment only** — never CTA |

**Chrome rules**
- Glass panels + thin luminous borders.
- **Cast Influence** = large glowing **blue** CTA.
- Amber CTA / cream card shadows = **banned**.
- Elevation = soft blue glow / glass depth — not cream drop shadows.
- Semantic success green OK for Results correct only — never decorative wallpaper.
- Text on accent: white.

---

## D. Typography

Keep DESIGN-SYSTEM pair on navy:

| Role | Family | On navy |
|------|--------|---------|
| Story / display | **Fraunces** | White primary |
| UI | **DM Sans** | White / muted cool gray |
| Micro / mono | **IBM Plex Mono** | Muted cool gray |

Scale: `--text-display` 28/34 · `--text-title` 22/28 · `--text-title-sm` 18/24 · `--text-body` 16/24 · `--text-body-sm` 14/20 · `--text-label` 12/16 · `--text-mono` 11/14.

**No Inter-only.** EN-first UI copy (product lock).

---

## E. Spacing / radius / elevation

### Spacing (4-based — from DESIGN-SYSTEM)
`--space-1` 4 · `2` 8 · `3` 12 · `4` 16 · `5` 20 · `6` 24 · `8` 32 · `10` 40 · `12` 48

### Radius
`--radius-sm` 8 · `--radius-md` 12 · `--radius-lg` 16 · `--radius-pill` 999

### Elevation (rebuild)
| Level | Spec |
|-------|------|
| 0 | Flat glass + `--color-border` hairline |
| 1 | Soft blue outer glow `0 0 24px rgba(59,142,240,0.25)` on primary CTA / selected tile |
| 2 | Modal / tutorial: denser navy surface + border; no cream card shadow |

Motion: keep `--motion-fast/base/slow` + reduced-motion rule. No confetti / bounce loops on Results.

---

## F. Component inventory

| Component | Notes | States |
|-----------|-------|--------|
| **Day chip** | Icon + `Day {n}` | default |
| **Free Influence chip** | Separate; `Free: {n}` + optional `+` → Buy | default · 0 · burned |
| **Extra Influence chip** | Separate; `Extra: {n}` + `+` | default · 0 · near cap |
| **USDC chip** | Plain text “USDC” — **no official mark** | default · tap → Buy/wallet |
| **Hero title + subline** | Fraunces title · DM Sans sub | — |
| **A/B/C illustrated tiles** | Art from WORKING-SET tiles + DOM label/body | default · focused · selected (blue glow) · disabled |
| **Cast Influence CTA** | Large glowing blue pill | default · hover · pressed · disabled (no bal / already cast) |
| **Buy packs Spark / Pulse** | Art `buy-pack-spark` / `buy-pack-pulse` | default · selected · purchasing · disabled (cap/geo) |
| **Fee breakdown 90/8/2** | Prize pool / Platform service / Nova budget | shown when pack selected |
| **Toast grant** | `+10 Free Influence` | show ~4s · tap dismiss |
| **Disclaimer checkbox** | Required before Home | unchecked · checked · error if CTA without |
| **Tutorial overlay** | Skip OK · 3 bullets | open · dismissed |
| **Results settlement** | Calm; paid/free share rows; Claim CTA | correct · miss · rollover · claim pending/done |
| **Nova spent row/chip** | Only if amount > 0 | hide if 0 |
| **/demo thin page** | Connect · buy · explorer links | idle · connected · bought · error |
| **Rank card** | Architect *in-game* title + XP bar | optional on Home |

**Hard rules:** Free/Extra never merged · Architect = in-game title only · fee language from BUY-INFLUENCE-UX.

---

## G. Screen-by-screen wire goals

EN-first primary CTA copy per product. Pixi vs DOM ownership. WORKING-SET asset ids.

### G1 — Onboarding (Connect → Disclaimer → Free10 toast → Home; optional tutorial)

| Region | Owner | Content / CTA |
|--------|-------|----------------|
| Scene underlay | Pixi | `scene_home_sunset_city` or textless master; Nova `nova_idle_stand_3q` or wave |
| Headline / body | DOM | `Nova just woke up.` + Architect in-game disclaimer body |
| Primary CTA | DOM | **`Connect wallet`** |
| Disclaimer checkbox | DOM | Required · `I accept the rules above` |
| Wrong network | DOM | **`Switch to Arc`** / Retry |
| Grant toast (on Home) | DOM | **`+10 Free Influence`** |
| Tutorial (optional) | DOM | **`Got it`** / Skip · over Home |

**Assets:** `scene-home-sunset-city-textless.png` · `nova-idle-stand-3q.png` / `nova-wave.png` · HUD icons.

### G2 — Home

| Region | Owner | Content / CTA |
|--------|-------|----------------|
| Full-bleed city | Pixi | parallax layers or master plate |
| Nova | Pixi | `nova_idle_stand_3q` |
| Top chips | DOM | Day · Free · Extra · USDC |
| Hero | DOM | e.g. `Design today's economy.` + subline |
| A/B/C tiles | DOM + tile art | Stabilize / Expand / Route (week overlays from Hikaye) |
| Rank card | DOM | Architect Apprentice (in-game) |
| Primary CTA | DOM | **`Cast Influence`** (or route into Vote then Cast) |
| Post-results chip | DOM | `Nova · spent {n} USDC` if > 0 |

**Assets:** FINAL-HOME look · `scene_home_sunset_city` / parallax · `tile_stabilize|expand|route` · `nova_idle_stand_3q` · hud icons · vfx soft.

**Eng target frame:** `reference/rebuild/home-target.png`

### G3 — Vote

| Region | Owner | Content / CTA |
|--------|-------|----------------|
| City (same family) | Pixi | Home plate + **dusk/cooler lighting tint** OK (no new plate required) |
| Nova | Pixi | `nova_wave` / idle; think pending later |
| Top chips + **goal chip** | DOM | Day · MOST/LEAST/MIDDLE · Free · Extra · USDC |
| Hero | DOM | `Cast today's Influence` |
| A/B/C tiles | DOM + art | Prominent; selected = blue glow |
| Spend stepper | DOM | Free/Extra split; cap hint |
| Primary CTA | DOM | **`Cast Influence`** |
| Secondary | DOM | `Need more Extra Influence?` → Buy |

**Assets:** same scene family · tiles · `nova-wave.png` · hud icons · `vfx-cta-glow`.

**Eng target frame:** `reference/rebuild/vote-target.png`

### G4 — Confirmation

| Region | Owner | Content / CTA |
|--------|-------|----------------|
| Scene | Pixi | Home plate + dim vignette OK |
| Nova | Pixi | idle / soft hold |
| Title / body | DOM | **`Influence cast`** · Locked until {voteCloseLocal} · Results ~{publishAtLocal} |
| Pending | DOM | `Saving your cast…` · `You can leave — we'll keep it.` |
| CTA | DOM | **`Back to Nova`** · optional Share |

No confetti. Calm navy glass card.

### G5 — Results

| Region | Owner | Content / CTA |
|--------|-------|----------------|
| Scene | Pixi | Home plate + golden-hour tint OK |
| Nova | Pixi | `nova_cheer` (correct) / `nova_soft_sad` (miss) |
| Winner line | DOM | `Canon today: {OptionName}` |
| Shares | DOM | Paid pool / Free pool separate; hide 0 |
| Miss / rollover | DOM | `No pool share today` / `Pool rolls to tomorrow` |
| Nova spent | DOM | Only if > 0 |
| Primary CTA | DOM | **`Claim {amount} USDC`** (hide if nothing) |
| Secondary | DOM | Share · `Back to Nova` |

Calm settlement — **no confetti**. Soft VFX only (`vfx-light-dust`, core pulse).

### G6 — Buy Influence

| Region | Owner | Content / CTA |
|--------|-------|----------------|
| Scene | Pixi | Home plate + slight “shop” tint OK (no new bay plate required for Eng start) |
| Balances | DOM | Free \| Extra **separate** cards |
| Packs | DOM + art | Spark 1→10 · Pulse 5→55 (`buy-pack-spark` / `buy-pack-pulse`) |
| Breakdown | DOM | 90% prize · 8% platform service · 2% Nova budget |
| Primary CTA | DOM | **`Buy with USDC`** |
| Secondary | DOM | `Back to vote` |
| Foot | DOM | Fee one-liner + non-affiliation (no Circle logos) |

### G7 — `/demo` grant page (P1.5)

Thin public page per `eng/P1.5-GRANT-DEMO-SPEC.md` G-05:

| Region | Owner | Content / CTA |
|--------|-------|----------------|
| Chrome | DOM | Navy+blue tokens only — **no** game HUD required |
| Connect | DOM | Arc mainnet connect |
| Buy | DOM | One Extra buy (Spark and/or Pulse) |
| Explorer | DOM | Buy tx + Nova signal tx links |
| Honesty copy | DOM | Story + programmable USDC + one real agent tx — no AGI claim |
| Marks | — | **No Circle / Arc official logos** |

Scene optional: solid `--color-bg` or muted city still; keep thin.

---

## H. Anti-slop checklist

- [ ] No greenery / solarpunk plants  
- [ ] No amber primary CTA (world gold env only)  
- [ ] No purple neon void / chrome-orb rain  
- [ ] No Circle / Arc / USDC **official** logo marks  
- [ ] No Inter-only UI personality  
- [ ] Free / Extra **never** merged into one spend bar  
- [ ] No APR / ROI / odds / “best odds” / guaranteed return  
- [ ] No confetti / coin rain on Results  
- [ ] Architect = **in-game title only** (not Circle Architects program)  
- [ ] Fee language: **platform service fee** / **Nova operating budget** (BUY-INFLUENCE-UX)  
- [ ] No baking live numbers into Pixi plates  
- [ ] Placeholder Phase-1 cream/amber HUD tokens **removed**

---

## I. Gap list (art vs lock — Eng blockers only)

Token-lean: **do not invent a regeneration batch.** Gaps below are notes only.

| Gap | Impact | Interim for Eng |
|-----|--------|-----------------|
| Dedicated `scene_vote_same_city_dusk` plate | Nice-to-have | **Reuse home plate + cooler dusk tint** |
| Dedicated `scene_results_golden_hour` | Nice-to-have | **Reuse home plate + warmer tint** |
| Dedicated `scene_buy_shop_bay` | Nice-to-have | **Reuse home plate + slight dim/shop scrim** |
| `scene_confirm_dim` | P1 | Home + vignette |
| Spine `nova_spine_v1` | Polish | Sprite poses in WORKING-SET |
| `tile_selected_glow_frame` bitmap | Polish | CSS blue glow OK |
| Week-1 overlays | Copy | `tiles/ov-week1.md` — DOM text over tile bases |

**Nothing in this gap list blocks Eng claim** if tint/reuse strategy is accepted (CEO GO token-lean).

---

## J. Eng handoff criteria

SPEC is **claimable** when all are true:

1. This SPEC exists and matches ART-DIRECTION-LOCK + FINAL-HOME thesis.  
2. `design/UI-REBUILD-BIND.md` present (asset map · tokens · Pixi/DOM · `/demo`).  
3. `design/reference/rebuild/` has `home-target.png` + `vote-target.png` (+ layer-split) + annotations README.  
4. Eng agrees: Phase-1 cream/amber placeholder HUD tokens removed; navy+blue only.  
5. Eng consumes art **only** via canon WORKING-SET / `@nova/assets` (no drafts).  
6. Runtime details continue to honor `research/ai-build/client-bind-contract.md` (SceneStage / HudModel) as complementary.

**Pointer:** bind contract for rebuild ticket = `design/UI-REBUILD-BIND.md`  
**Pointer:** runtime bind = `research/ai-build/client-bind-contract.md`

---

*Design · UI rebuild SPEC · 2026-09-28 · Istanbul · token-lean*
