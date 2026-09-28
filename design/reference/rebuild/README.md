# Rebuild annotated references

**Purpose:** Eng visual targets for Full UI Rebuild (CEO GO 2026-09-28).  
**Not** a new Flux art batch — overlays / composed wires on WORKING-SET + FINAL-HOME.  
**Do not** treat these PNGs as runtime canon textures (except as QA screenshots).

| File | Role |
|------|------|
| `home-target.png` | Annotated copy of `../FINAL-HOME.png` — region labels for chips, hero, Nova, A/B/C, Cast Influence |
| `vote-target.png` | Composed Vote target — home city family + dusk tint + navy HUD chrome + tiles + spend + Cast Influence (780×1688 portrait) |
| `onboarding-target.png` | Composed Onboarding / Connect target — home city + dusk tint + Nova + navy glass card + Connect wallet (780×1688 portrait) |
| `layer-split.png` | React HUD vs SceneStage vs Pixi stack diagram |
| `HOME-VOTE-ANNOTATIONS.md` | Logical zones + Pixi/DOM notes for Home + Vote |
| `ONBOARDING-ANNOTATIONS.md` | Logical zones + Pixi/DOM notes for Onboarding Connect |

**Locks:** `../../ART-DIRECTION-LOCK.md` · `../FINAL-HOME.png` · `../WORKING-SET.md` · `../../UI-REBUILD-SPEC.md` · `../../UI-REBUILD-BIND.md`

**Originals untouched:** `FINAL-HOME.png` was not modified.

## Binaries in this repo

The annotated PNG frames (`home-target.png`, `vote-target.png`, `onboarding-target.png`, `layer-split.png`) and `FINAL-HOME.png` were the CEO review attachments. They were not in the git checkout, so this PR does not invent replacements. Region intent lives in the annotation markdown here. Runtime plates stay the canon ids already in `packages/assets/canon` (see `WORKING-SET.md`). Vote, results, buy, and confirm reuse the home scene with a DOM tint.
