# Nova

pnpm monorepo for Nova. Phase 0 scaffold is in place. This branch adds **P1-01**: shared prize-pool math and unit tests in `@nova/shared`.

There is still **no buy/vote UI**, **no wallet**, and **no contracts**. Pool formulas live only in `packages/shared` so later UI can import them instead of duplicating math.

## Status

| Phase | Scope |
| --- | --- |
| **0** | Tooling, 8 product route placeholders, lazy PixiJS v8 canvas host, navy-glass tokens, asset canon/drafts layout, CI. |
| **P1-01 (current)** | `@nova/shared` Extra Influence buy split, day pool, packs, caps, settlement, SPARK stub. Tests only — no HUD. |
| **1 (next)** | PixiJS renderer plus a **blue HUD** overlay on the Home scene. |

## Workspace

| Path | Package | Role |
| --- | --- | --- |
| `apps/web` | `@nova/web` | Vite + React + TypeScript shell, React Router, Home Pixi stub |
| `packages/shared` | `@nova/shared` | Pool math, packs, Influence caps, SPARK constants, tests |
| `packages/config` | `@nova/config` | Shared TypeScript config, app constants, color tokens |
| `packages/assets` | `@nova/assets` | `canon/`, `drafts/`, reference pointer, empty canon manifest |

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

Home mounts a **lazy** PixiJS v8 scene host (`import("pixi.js")` on mount). The canvas may be empty.

Design tokens: `--color-accent: #2775CA` and `--color-glow: #3B8EF0` (navy glass). No amber.

## Setup

Requires Node 22+ and [pnpm](https://pnpm.io) 10+.

```sh
pnpm install
cp .env.example .env.local
pnpm dev
```

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

`pnpm dev` starts the web shell at http://localhost:5173.

## CI

GitHub Actions / Origin-compatible workflow: `.github/workflows/ci.yml`.

It runs on pushes to `main` and on pull requests:

1. `pnpm install --frozen-lockfile`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm test`
5. `pnpm build`

Run the same locally with `pnpm quality`.
