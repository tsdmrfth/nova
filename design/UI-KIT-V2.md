# Nova — UI Kit v2 (chrome + layout source of truth)

**Status:** AUTHORITATIVE for chrome, layout, type and screen structure  
**Owner:** Nova · Design  
**Audience:** Eng (read before touching any HUD, sheet or screen)  
**Date:** 2026-10-02 · Europe/Istanbul  
**Source:** claude.ai/design project `f9b85501-5935-48ec-a42e-1a1ce988b014` · reference copies in `design/ui-kit-v2/`

| File | Role |
|------|------|
| `ui-kit-v2/Nova UI Kit v2.dc.html` | 14 screens at 390 × 844 + component legend |
| `ui-kit-v2/nova-theme.css` | Token source. `apps/web/src/styles/tokens.css` mirrors it verbatim |
| `ui-kit-v2/NovaScene.dc.html` | Plate layer: city image + two gradients + optional dim |

---

## 1. What this supersedes

For **chrome only** (tokens, type, layout, component look, screen structure), this doc wins over:

- `UI-REBUILD-SPEC.md` §B–§G
- `UI-HOME-CODED-STYLE.md` (whole doc)
- `UI-REBUILD-BIND.md` Pixi/DOM ownership table and pose map

**Product locks still win** over the kit: `ART-DIRECTION-LOCK.md` product bans, Free/Extra separation, fee language from BUY-INFLUENCE-UX, Architect = in-game title only, no Circle / Arc official marks.

## 2. Screen map

The v2 screens follow the same flow as SPEC §G. Nothing is reordered.

| Spec | v2 screen | Route |
|------|-----------|-------|
| G1 | 01 Connect · 02 Soft-launch notice · 03 Free +10 toast · 04 Tutorial | `/connect` → `/` |
| G2 | 05 Home | `/` |
| G3 | 06 Vote | `/vote` |
| G4 | 07 Vote locked | `/confirmation` |
| G5 | 08 Matched · 09 Not this round · 10 Claim pending · 11 Claim done | `/results` |
| G6 | 12 Buy Extra Influence | `/buy` |
| G7 | 14 `/demo` grant page | `/demo` |
| — | 13 Menu (replaces Profile + nav) | overlay |

## 3. Guardrails (where the kit is overridden)

1. **Buy entry.** The kit's Home and Vote screens have no route to Buy. The EXTRA balance chip is a button to `/buy`, and Vote keeps the "Need more Extra Influence?" hint (SPEC G3).
2. **Packs.** The kit's 5 / 10 / 25 at 1:1 is a placeholder. Render `PACK_CATALOG` from `@nova/shared` (Spark 1 → 10, Pulse 5 → 55).
3. **Fee labels.** The kit says "Studio · 8%". Use `PLATFORM_FEE_LABEL` and `NOVA_BUDGET_LABEL` from `@nova/shared`.
4. **Results edge states.** Rollover and need-cast are not drawn in the kit. They render as variants of 09 (Not this round). They are not dropped. The SPEC G5 "Nova spent" row was never wired to data before v2 either; it stays open until the signal snapshot reaches the game loop.
5. **Claim failure.** "Claim didn't go through" + Retry, per the 10 note.
6. **Nova poses.** Nova is baked into the plate, so cheer / soft_sad pose swaps are gone. Results "cheer" is the orb glow easing in once (600 ms). This is a deliberate override of BIND / SPEC G5.
7. **Removed from UI.** A/B/C art tiles, USDC chip, SPARK row, Share button, Home disclaimer line. Data and models stay.
8. **Banned finance terms.** The kit's "does not increase win odds" uses a word on `FORBIDDEN_FINANCE_TERMS` (`@nova/shared`). Ship "doesn't make your pick more likely to win" instead. The same applies to any kit copy that hits APR / odds / RTP / house edge / guaranteed yield / TGE.

Social sign-in (Google / Email) on 01 is out of scope until there is a backend. Ship "Connect Arc wallet" only.

## 4. Layout rules

- Phone frame 390 × 844, 24 px side margins. On wider screens the HUD column is centred at max 430 px and the plate stays full-bleed.
- The plate is a static image (`scene_nova_city`) with `object-fit: cover`. Nova sits on the right edge and must stay visible above every bottom sheet.
- Story copy sits on the left, at most 62–68 % of the width.
- Top chrome starts at 52 px (below the status bar / safe area). Bottom sheets sit 24 px above the bottom edge.
- Tap targets ≥ 44 px. Toggles are a 38 × 22 track inside a 44 px target.

### 4.1 Fit-to-screen (user feedback, 2026-10-02)

**Rule:** a no-scroll screen must fit the viewport exactly on every phone size, with no clipping and no dead gap. Scroll is allowed only on screens whose content is inherently long (Buy, Menu, /demo, Soft-launch notice on short phones).

What the first v2 pass got wrong (seen at 375 × 667 iPhone SE and 440 × 956 Pro Max):
- **Top spacing is too large.** `.nv-screen__hud` uses `max(52px, safe-area + 12px)` at the top. The 52 px comes from the kit's mock 46 px status bar, which a real device already provides through `env(safe-area-inset-top)`. Use the safe-area inset plus a small gap (about 8–12 px).
- **SE (667 px tall):** the Home CTA is cut off at the bottom; the HUD scrolls instead of fitting.
- **Pro Max (956 px tall):** a large empty band sits between the chapter panel and the choice cards.

How to implement it:
- Make the frame a real flex column at `height: 100dvh` with three regions: top chrome (`flex: none`), middle (`flex: 1 1 auto; min-height: 0`), bottom group (`flex: none`, anchored to the bottom). Space between regions comes from flex, not fixed margins.
- The middle (story/chapter panel, Vote heading) is the region that gives: it shrinks first. Clamp its type and padding with `clamp()` and line-clamp the scene copy on short heights.
- Scale vertical rhythm with height: gaps, choice-card min-height (56 → 48), CTA height (52 → 48) via `clamp(…, …vh, …)` or `@media (max-height: 700px)` steps.
- Do not use `overflow-y: auto` as the default on `.nv-screen__hud`; opt in per long screen (for example a `.nv-screen__hud--scroll` modifier).
- Verify each no-scroll screen (01 Connect, 03–05 Home, 06 Vote, 07 Vote locked, 08–11 Results/Claim) at 375 × 667, 390 × 844, 430 × 932 and 440 × 956. There must be no scroll, no clipping, and Nova's head must stay visible above the bottom group.

## 5. Components (kit legend)

| Component | Notes |
|-----------|-------|
| Chips | Square (12 px radius) for data, pill for status, 28 px tag for labels. 44 px min height |
| Balance chips | FREE / EXTRA, always separate |
| Choice card | default · selected (selected fill + check) · winner (WINNER tag) · dimmed |
| Stepper | 44 px − / + around a tabular value. Free and Extra always render as two separate steppers |
| CTAs | Primary 52 px · Secondary (blue outline) 44 px · Tertiary (neutral) 44 px · Disabled / pending |
| Status orb | 72 px, overlaps the sheet top by 36 px. check · x · trophy · spinner |
| Receipt | Glass rows with soft dividers, tabular numbers |
| Type | Story + status titles in `--nova-story-font`. UI chrome in Inter |

## 6. Motion

- Toast slides down 240 ms and holds 2.4 s.
- Spinner turns once per 1.8 s, linear. It stops under Calm motion or `prefers-reduced-motion`.
- Selection border / shadow transitions 180 ms.
- No confetti, no shake, no red.
- Menu (13) is a frame-wide drawer pinned to the top edge with no gap (the safe-area inset is padding inside it). It drops in 360 ms and pulls back up 260 ms, translate only. An overlay covers the rest of the screen, HUD buttons included, with no fade; tapping it closes the Menu.
- How today works (04) rises from the bottom edge 360 ms, `cubic-bezier(0.2, 0.8, 0.2, 1)`, and on Got it / Skip drops back down 260 ms, `cubic-bezier(0.4, 0, 1, 1)`; translate only. An overlay covers the whole screen, HUD included, with no fade. Calm motion and `prefers-reduced-motion` drop both slides.

### 6.1 Screen transitions (user feedback, 2026-10-02)

Route changes slide; they never fade. The city plate (and Nova in it) stays still: only the screen's stage (dim, HUD, overlays) moves. A step in the day and a change of place are a full handoff, so both screens stay visible. A layer covers the open screen instead, and that screen only shifts. 420 ms, `cubic-bezier(0.65, 0, 0.35, 1)` (ease-in-out, so the travel reads instead of jumping).

The direction comes from how the two screens relate, not from browser history (`apps/web/src/screenFlow.ts`):

| Relationship | Screens | Moving on | Moving back |
|---|---|---|---|
| Daily loop (full horizontal handoff) | Connect → Home → Vote → Confirmation → Results | New screen enters from the right, the old one leaves left | New screen enters from the left, the old one leaves right |
| Layer (vertical cover) | Buy, Guide (`/guide`, Menu › Help › Full guide), `/demo` | Rises from the bottom and covers; the screen underneath only shifts up | The layer drops down; the screen underneath settles back |
| Place (full vertical handoff) | Neighborhood | Arrives from the top while the open screen leaves downward | The place leaves upward; the day screen enters from the bottom |

Calm motion and `prefers-reduced-motion` switch the slide off. Every route must render its own page component, so the frame remounts and the slide runs (`ui/screenMotion.ts`).

## 7. Open items and known issues

| Item | Notes |
|------|-------|
| Fit-to-screen layout | §4.1. Not done yet. Highest priority |
| Dev "Routes" jumper overlaps the bottom CTA | `App.tsx` `DevRouteJump`, bottom-left. Dev builds only, but it hides the CTA on small phones. Move it to the top or make it a corner dot |
| "Nova spent" row (SPEC G5) | Never wired to data. Needs the signal snapshot in the game loop |
| Day 2+ story content | `content/season1.ts` only has Day 1. The Results tease says "Chapter 02 opens tomorrow" until real copy exists |
| Claim amounts show 6 decimals | Exact micro-USDC (e.g. 0.105882). Kept on purpose; decide whether to show 2 decimals with the exact value on tap |
| Explorer links on claim sheets | `ResultsPage` passes `explorerUrl={null}` for the offline mock claim. Wire them up when claims go onchain |
| Menu wallet line | Shows "Arc wallet"; no address in the mock onboarding state |
| Daily reminder toggle | Stored per device (`menu/prefs.ts`), no behaviour behind it yet |
| Node 26 test shim | `apps/web/src/test/setup.ts` re-points `localStorage`/`sessionStorage` to jsdom because Node ≥ 25 shadows them. The repo pins Node 22 (`.nvmrc`) |
| `?claim=fail` QA flag | Read once when the app loads (`DayStoreProvider`) |

