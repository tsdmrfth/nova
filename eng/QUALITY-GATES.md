# Nova — Quality Gates

Aligned with `ENGINEERING-PLAN.md` · `PRODUCT.md` §15 · `OPS-MODEL.md` · `design/ART-DIRECTION-LOCK.md` · `research/ai-build/CEO-SYNTHESIS.md` §1.

**Owner:** Nova · Eng (enforcement once PRs exist). CEO merge decision. User tests builds / requests features via CEO.  
**CODE FREEZE:** No PRs yet — gates apply when freeze lifts and Phase 0 starts.

---

## Every PR
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] No secrets / no `.env` committed
- [ ] Pool math changes → `packages/shared` tests updated (no formula duplication in UI)
- [ ] UI: **ART-DIRECTION-LOCK** — navy/cobalt glass HUD + electric blue (`#2775CA` / `#3B8EF0`); warm gold = world light only
- [ ] UI: full-bleed scene + floating HUD + illustrated tiles; reject amber-first, cozy/greenery, purple neon void, fintech-form
- [ ] Runtime (PRODUCT §15): React HUD + Pixi scene lazy; no Phaser / R3F as app core
- [ ] Assets: production imports only `@nova/assets` → **canon** ids; never `drafts/`
- [ ] No official Circle / Arc / USDC logo marks; no “partnered with Circle Architects”
- [ ] No APR / odds / RTP / guaranteed-yield copy

## Phase 0 specific
- [ ] `packages/assets` manifest stub present
- [ ] Pixi v8 dependency wired with stub scene host (may be empty)
- [ ] No pool/fee/pack math yet; no contracts; no wallet business logic

## Phase 1+
- [ ] Shared math coverage (buy 90/8/2, day 90/10, packs, caps, roll-over)
- [ ] Pixi (or approved fallback) bound to canon placeholders
- [ ] World tile labels Stabilize/Expand/Route when choice tiles ship

## Phase 1.5+ (when CEO locks tool)
- [ ] Asset CI: manifest schema, size limits, license metadata
- [ ] Staged visual regression baselines (Playwright or Chromatic)

## Phase 2+
- [ ] API integration test for day settle math

## Phase 3+
- [ ] `forge test`
- [ ] Invariant: prize + studioNet + novaBudget == ExtraInfluence gross, including studio net already withdrawn and Nova budget already spent
- [ ] Nova operating-budget spend is signal-only; no prize top-up
- [ ] Güvenlik checklist section mapped

## Sign-off
Eng records pass/fail → CEO merge. User validates via testable build links from CEO.

## Design reference
- Lock: `/workspace/nova/design/ART-DIRECTION-LOCK.md`
- Image: `/workspace/nova/design/reference/FINAL-HOME.png`
- AI-build: `/workspace/nova/research/ai-build/CEO-SYNTHESIS.md`
