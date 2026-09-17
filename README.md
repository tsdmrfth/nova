# Nova

pnpm monorepo for Nova. Phase 0 scaffold is in place. **P1-01** added shared prize-pool math in `@nova/shared`. This branch is **P1-02**: bind the Home route to a lazy PixiJS v8 scene plus the floating navy-glass HUD from the art lock.

There is still **no wallet**, **no Cast/Vote flow**, and **no pool math in the UI**. Prize-pool formulas stay in `@nova/shared`. Home numbers are layout placeholders.

## Status

| Phase | Scope |
| --- | --- |
| **0** | Tooling, 8 product route placeholders, lazy PixiJS v8 canvas host, navy-glass tokens, asset canon/drafts layout, CI. |
| **P1-01** | `@nova/shared` Extra Influence buy split, day pool, packs, caps, settlement, SPARK stub. Tests only — no HUD. |
| **P1-02 (current)** | Canon asset ids + default day pack, abstract sunset-city Pixi layers, Home HUD chrome. |
| **P1-03 (next)** | Cast / Vote flow. |

## Workspace

| Path | Package | Role |
| --- | --- | --- |
| `apps/web` | `@nova/web` | Vite + React + TypeScript, React Router, Home Pixi scene + HUD |
| `packages/shared` | `@nova/shared` | Pool math, packs, Influence caps, SPARK constants, tests |
| `packages/config` | `@nova/config` | Shared TypeScript config, app constants, color tokens |
| `packages/assets` | `@nova/assets` | Canon manifest, day packs, placeholder plates (`drafts/` is unpublished) |

## Home bind

React owns HUD copy, chips, A/B/C tiles, and the Cast button. Pixi owns the full-bleed world (sky / skyline / water / platform / Nova). Both address art only through `@nova/assets` helpers (`getAsset`, `getAssetUrl`, `getDayPack`, `assertCanon`). Production code never imports `drafts/`.

Placeholder plates are abstract SVG layers in `packages/assets/canon/` matching the lock colors (electric blue `#2775CA`, glow `#3B8EF0`, sunset gold as world light only). Photographic `FINAL-HOME.png` is not shipped — it is too large and is a HUD mock, not a textless plate.

Cast Influence is layout-only in this slice: selecting a tile highlights it; the CTA does not start a vote.

## Pool math (`@nova/shared`)

Canonical formulas (CEO lock). Amounts are **micro-USDC** (`bigint`, 6 decimals).

| Rule | Formula |
| --- | --- |
| Extra buy split | 90% prize pool / 10% studio fee (0% reserve in S1) |
| Day pool P | Σ(gross × 0.90) + previous-day rollover |
| Day buckets | 90% of P → paid winners / 10% of P → free winners |
| Paid share | `PaidBucket × effectiveExtra_i(W*) / Σ effectiveExtra(W*)` |
| Free share | `FreeBucket × effectiveFree_i(W*) / Σ effectiveFree(W*)` |
| Spark pack | 1 USDC → 10 Extra (pool 0.90 / fee 0.10) |
| Pulse pack | 5 USDC → 55 Extra (pool 4.50 / fee 0.50) |
| Free grant | 10 / wallet / day; unused burns (no roll) |
| Caps | `effectiveExtra = min(raw, 100)`; max 10 USDC Extra buy / day |
| Empty lane | unused paid and/or free bucket rolls into next-day P |
| SPARK | +5 vote lock, +15 correct, +25 weekly streak — non-tradable |

Import from `@nova/shared`: `quotePack`, `buildDayPrizePool`, `settleDay`, `effectiveExtra`, `SPARK_TABLE`, and related types.

Worked example (20 Spark + 8 Pulse): gross 60 → studio 6, P 54 → paid 48.6 / free 5.4.

## Product routes

| Route | Path |
| --- | --- |
| Connect | `/connect` |
| Home | `/` |
| Vote | `/vote` |
| Buy | `/buy` |
| Confirmation | `/confirmation` |
| Results | `/results` |
| Nova/Neighborhood | `/neighborhood` (`/nova` redirects here) |
| Profile | `/profile` |

Routes other than Home remain placeholders.

## Setup

Requires Node 22+ and [pnpm](https://pnpm.io) 10+.

```sh
pnpm install
cp .env.example .env.local
pnpm dev
```

`pnpm dev` starts the web shell at http://127.0.0.1:43123.

## Scripts

Run from the repo root:

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Same four gates as CI:

```sh
pnpm quality
```

Regenerate canon placeholder plates (optional):

```sh
node packages/assets/scripts/generate-placeholders.mjs
```

## CI

GitHub Actions / Origin-compatible workflow: `.github/workflows/ci.yml`.

It runs on pushes to `main` and on pull requests:

1. `pnpm install --frozen-lockfile`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm test`
5. `pnpm build`
