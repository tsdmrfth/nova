# Nova

pnpm monorepo for Nova. Phase 0 scaffold is in place. **P1-01** added shared prize-pool math in `@nova/shared`. **P1-02** bound Home to a lazy PixiJS v8 scene plus the floating navy-glass HUD. **P1-03** wired Cast Influence. **P1-04** added Extra Influence buy packs. **P1-05** added Results + offline day settle. **P1-09** added first-run onboarding. This branch is **P1-06**: Season 1 copy and rounds 01–10 wired into Home, Vote, Confirmation, and Results.

There is still **no wallet** and **no on-chain**. Prize-pool formulas stay in `@nova/shared`. This branch is stacked on P1-09 (which includes P1-05); those commits are not on `main`. Day advance stays with P1-07.

## Status

| Phase | Scope |
| --- | --- |
| **0** | Tooling, 8 product route placeholders, lazy PixiJS v8 canvas host, navy-glass tokens, asset canon/drafts layout, CI. |
| **P1-01** | `@nova/shared` Extra Influence buy split, day pool, packs, caps, settlement, SPARK stub. Tests only — no HUD. |
| **P1-02** | Canon asset ids + default day pack, abstract sunset-city Pixi layers, Home HUD chrome. |
| **P1-03** | Day 1 Vote/Home cast shell: Stabilize / Expand / Route tiles, Free Influence spend into an in-memory day store, MOST/LEAST/MIDDLE goal stub. |
| **P1-04** | `/buy` Extra Influence: Spark 1 USDC → 10 Extra, Pulse 5 USDC → 55 Extra via `quotePack` / `attemptBuy`. Mock pay, no chain. |
| **P1-05** | `/results` offline settle via `pickWinningOption` / `buildDayPrizePool` / `settleDay` / `sparkForDay`. Claim CTA on Results; Profile is history-only. |
| **P1-09** | `/connect` first-run: disclaimer, mock Connect / Continue, +10 Free grant toast, skippable tutorial, geo-block + Switch to Arc. Persists in localStorage. |
| **P1-06 (current)** | Typed Season 1 rounds 01–10. Home, Vote, Confirmation, and Results read scene, choices, and B3/B5/B6 copy from that source. |

## Workspace

| Path | Package | Role |
| --- | --- | --- |
| `apps/web` | `@nova/web` | Vite + React + TypeScript, React Router, Connect/Home/Vote/Buy/Results cinema HUD |
| `packages/shared` | `@nova/shared` | Pool math, packs, Influence caps, day-goal / W* scoring, SPARK constants, tests |
| `packages/config` | `@nova/config` | Shared TypeScript config, app constants, color tokens |
| `packages/assets` | `@nova/assets` | Canon manifest, day packs, placeholder plates (`drafts/` is unpublished) |

## Cast / Vote shell

Home (`/`) and Vote (`/vote`) share one cinema Cast screen. React owns HUD copy, chips, A/B/C tiles, Free spend, and the **Cast Influence** button. Pixi owns the full-bleed world. Both address art only through `@nova/assets` helpers (`getAsset`, `getAssetUrl`, `getDayPack`, `assertCanon`). Production code never imports `drafts/`.

Default content is **Day 1 · First light**. Rounds 01–10 live in `apps/web/src/content/season1.ts` (HIKAYE) and `apps/web/src/content/s1Copy.ts` (COPY-S1). World labels stay Stabilize / Expand / Route. Tile art uses canon ids `tile_stabilize` / `tile_expand` / `tile_route`.

Open `/?day=8` (or `/vote?day=8`, `/results?day=8`, `/confirmation?day=8`) to preview that round. The query is read once; route changes keep the same day in memory. It does not advance a season or burn Free between days.

Casting spends Free Influence through `@nova/shared` `grantDailyFree` / `spendInfluence` into an in-memory day store (local player id, no wallet). Partial spend is allowed before the CTA; the first successful cast locks the day. Extra bought today is placed on that same option as a separate lane.

## Extra Influence buy

`/buy` is a cinema HUD over the same sunset plate. Free and Extra balances stay on separate cards. Pack math is not duplicated in the UI: `quotePack` supplies Extra granted and the 90/10 USDC split; `attemptBuy` enforces the 10 USDC / day cap. **Buy with USDC** is mock pay (credits Extra in memory; no chain). Pulse is the default / Most chosen pack. Canon art ids: `pack_spark`, `pack_pulse`.

Vote links in with `Need more Extra Influence?` (and the USDC chip). Selected A/B/C tiles stay selected when you return.

## Results + settle

`/results` runs an **offline** day close after cast (optional mock buy). Fake crowd tallies seed a demo pool; player packs/casts merge in. Math is not duplicated in the HUD:

- `pickWinningOption` scores W* from **Free** tallies + the day goal (Extra never picks the winner)
- `buildDayPrizePool` builds P and the paid/free buckets
- `settleDay` / `payoutsByWallet` pro-rate USDC
- `sparkForDay` awards in-game SPARK points (not money)

COPY-S1 B6: **Canon today**, day goal, paid/free share rows (hide 0), miss / roll-over, **Claim {n} USDC** as the primary CTA. Profile (`/profile`) shows cast + claim history only — no claim button. Optional winner badge art: canon id `badge_winner`.

Day 1 demo crowd: MOST lands on **Expand / Say hello**.

## First-run onboarding

Unseen visitors are gated to `/connect` until they accept the locked disclaimer and mock-connect (or Continue — no real wallet). After that:

1. Home Day 1 (`First light`) with a **+10 Free Influence** grant toast (first-day body, tap or ~4s dismiss)
2. Skippable **How today works** overlay (MOST / LEAST / MIDDLE + Free vs Extra)
3. Cast shell as in P1-03

Flags persist in `localStorage`: `nova.onboarding.disclaimerAccepted`, `nova.onboarding.tutorialSeen`, `nova.onboarding.connected`.

Edge faces (COPY-S1 / ONBOARDING-EDGE-COPY, locked EN):

| Face | Preview | Copy |
| --- | --- | --- |
| Geo block | `/?edge=geo` or `/?geo=blocked` | Not available here yet |
| Wrong network | `/connect?edge=network` | Switch to Arc · Retry |
| Reject / locked wallet | `/connect?edge=reject` · `?edge=locked` | Try again / Open wallet |

Force geo in a deploy with `VITE_GEO_BLOCKED=1`. No KYC, no Circle/Arc logo marks, no APR/odds claims.

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
| Day goal | Day1 MOST · Day2 LEAST · Day3 MIDDLE · repeat (`dayGoalFor`) |
| W* | `pickWinningOption` from Free tallies only |

Import from `@nova/shared`: `quotePack`, `buildDayPrizePool`, `settleDay`, `pickWinningOption`, `effectiveExtra`, `spendInfluence`, `grantDailyFree`, `dayGoalFor`, `sparkForDay`, `SPARK_TABLE`, and related types.

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

Home and Vote are the Cast Influence shell. Buy is Extra Influence checkout. Results is the day-settle + claim HUD. Confirmation shows the active round and, after a cast, **Influence cast** plus the locked-until line. Profile is history-only. Connect is the first-run Welcome / disclaimer / mock wallet gate. Neighborhood remains a placeholder.

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
