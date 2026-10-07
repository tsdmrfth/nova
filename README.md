# Nova

pnpm monorepo for Nova. Phase 0 scaffold is in place. **P1-01** added shared prize-pool math in `@nova/shared`. **P1-02** bound Home to a lazy PixiJS v8 scene plus the floating navy-glass HUD. **P1-03** wired Cast Influence. **P1-04** added Extra Influence buy packs. **P1-05** added Results + offline day settle. **P1-09** added first-run onboarding. **P1-07** added Confirmation for the in-memory day. This branch is **P1.5**: an Arc money-path demo (contracts + `/demo`). The game loop runs onchain against `NovaPool` through a browser wallet: buy, vote, settle, claim. Mainnet is not live in this repo — deploy keys, a public host, and a public GitHub repo are human steps.

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
| **P1-07** | `/confirmation` reads the in-memory day (pick, Free vs Extra, close / publish stamps) and opens Results after a cast. Connect → Home → Vote → Buy → Confirmation → Results stays on one `DayState`. |
| **P1.5 (current)** | Public Arc mainnet slice: `@nova/shared` buy split 90/8/2, Foundry `NovaPool` + `NovaSignal`, deploy script, thin `/demo` page. Addresses are placeholders until a human broadcasts. |

## Workspace

| Path | Package | Role |
| --- | --- | --- |
| `apps/web` | `@nova/web` | Vite + React + TypeScript, React Router, Connect/Home/Vote/Buy/Results cinema HUD, `/demo` |
| `packages/shared` | `@nova/shared` | Pool math, packs, Influence caps, day-goal / W* scoring, SPARK constants, tests |
| `packages/config` | `@nova/config` | Shared TypeScript config, app constants, color tokens |
| `packages/assets` | `@nova/assets` | Canon manifest and the live city plate (`drafts/` is unpublished) |
| `contracts` | Foundry | `NovaPool`, `NovaSignal`, Arc deploy script |

## Cast / Vote shell

Home (`/`) and Vote (`/vote`) share one cinema Cast screen. React owns HUD copy, chips, A/B/C tiles, Free spend, and the **Cast Influence** button. The full-bleed plate comes from `@nova/assets` (`getAssetUrl("scene_nova_city")`). Production code never imports `drafts/`.

Default content is **Day 1 · First light** (HIKAYE / COPY-S1): scene, self titles/captions, world labels Stabilize / Expand / Route, day goal **MOST**.

Casting spends Free Influence through `@nova/shared` `grantDailyFree` / `spendInfluence` into an in-memory day store (local player id, no wallet). Partial spend is allowed before the CTA; the first successful cast locks the day. Extra bought today is placed on that same option as a separate lane.

## Extra Influence buy

`/buy` is a cinema HUD over the same city plate. Free and Extra balances stay on separate cards. Pack math is not duplicated in the UI: `quotePack` supplies Extra granted and the 90/8/2 USDC split; `attemptBuy` mirrors the 10 USDC / day cap the pool enforces. **Confirm buy** is a wallet transaction: one bounded USDC approval when needed, then `buyExtraInfluence`; Extra and spent-today are read back from the pool. Pulse is the default / Most chosen pack.

Vote links in with `Need more Extra Influence?` (and the USDC chip). Selected A/B/C tiles stay selected when you return.

## Results + settle

`/results` reads the pool's latest settled day (today once settled, otherwise yesterday). `NovaPool.settleDay` picks W* onchain from **Free** tallies + the day goal (Extra never picks the winner) and snapshots the 90/10 buckets; each winner pulls their share with `claim`. The HUD shows the same floor pro-rata the contract pays (`shareFor` in `apps/web/src/chain/novaChain.ts`). `@nova/shared` (`pickWinningOption`, `settleDay`, …) stays the reference math and drives the test fake. `sparkForDay` awards in-game SPARK points (not money) on the client.

COPY-S1 B6: **Canon today**, day goal, paid/free share rows (hide 0), miss / roll-over, **Claim {n} USDC** as the primary CTA. Profile (`/profile`) shows cast + claim history only — no claim button.

## First-run onboarding

Unseen visitors are gated to `/connect` until a browser wallet connects on Arc and they accept the locked disclaimer. After that:

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
| Extra buy split | 90% prize pool / 8% studio net / 2% Nova operating budget |
| Day pool P | Σ(gross × 0.90) + previous-day rollover |
| Day buckets | 90% of P → paid winners / 10% of P → free winners |
| Paid share | `PaidBucket × effectiveExtra_i(W*) / Σ effectiveExtra(W*)` |
| Free share | `FreeBucket × effectiveFree_i(W*) / Σ effectiveFree(W*)` |
| Spark pack | 1 USDC → 10 Extra (pool 0.90 / studio net 0.08 / Nova budget 0.02) |
| Pulse pack | 5 USDC → 55 Extra (pool 4.50 / studio net 0.40 / Nova budget 0.10) |
| Free grant | 10 / wallet / day; unused burns (no roll) |
| Caps | `effectiveExtra = min(raw, 100)`; max 10 USDC Extra buy / day |
| Empty lane | unused paid and/or free bucket rolls into next-day P |
| SPARK | +5 vote lock, +15 correct, +25 weekly streak — non-tradable |
| Day goal | Day1 MOST · Day2 LEAST · Day3 MIDDLE · repeat (`dayGoalFor`) |
| W* | `pickWinningOption` from Free tallies only |

Import from `@nova/shared`: `quotePack`, `buildDayPrizePool`, `settleDay`, `pickWinningOption`, `effectiveExtra`, `spendInfluence`, `grantDailyFree`, `dayGoalFor`, `sparkForDay`, `SPARK_TABLE`, and related types.

Worked example (20 Spark + 8 Pulse): gross 60 → prize 54, studio net 4.8, Nova budget 1.2 → paid 48.6 / free 5.4. Day buckets of P stay 90/10. The Nova budget is not a second cut of P.

## Arc mainnet demo (P1.5)

Public route: `/demo` (not behind the Connect gate). It targets **Arc mainnet, chain id 5042**.

What it is: a story, programmable USDC, and one real agent transaction after settle. The agent transaction is a public USDC **signal** from the 2% Nova operating budget to Nova's public Arc wallet, with an on-chain cap and caller allowlist. It does not top up the prize pool. It is not a general intelligence and it is not a Circle partnership. The page does not use official Circle, Arc, or USDC logo marks, and it does not state APR, odds, or RTP.

What is in git:

- `contracts/src/NovaPool.sol` — `buyExtraInfluence` for Spark (`1`) and Pulse (`2`), `castVote`, `settleDay` (picks W* onchain and snapshots the 90/10 buckets), pull-based `claim`, budget ledger. Owner (a Safe on mainnet) and operator roles, a pause that never blocks claims, two-step ownership; not upgradeable. Invariant: prize + studio net + Nova budget, including amounts already paid out of studio net and the operating budget, equals gross.
- `contracts/src/NovaSignal.sol` — post-settle `signal` to the configured wallet only.
- `contracts/script/DeployNova.s.sol` — refuses every chain except 5042 unless `ALLOW_NON_MAINNET=true` (testnet or anvil rehearsal), then hands ownership to `OWNER_ADDRESS` in two steps.
- `contracts/README.md` — roles, upgrade policy, Arc specifics, release checklist, broadcast commands. **Testnet-only is not a Microgrant submit.**

What is still a placeholder (human):

| Item | Status |
| --- | --- |
| GitHub repo visibility | Private until a human makes it public |
| `NovaPool` | `PENDING_HUMAN_DEPLOY` |
| `NovaSignal` | `PENDING_HUMAN_DEPLOY` |
| Nova public wallet | Set `NOVA_WALLET` at deploy. Not in git. |
| Deployer USDC (gas + a tiny buy) | Human-funded. No key in git. |
| Buy tx | `PENDING_HUMAN_BROADCAST` — explorer `https://explorer.arc.io/tx/<hash>` |
| Signal tx | `PENDING_HUMAN_BROADCAST` — same explorer |
| Live host URL | `PENDING_HUMAN_HOST` |

USDC on Arc (public protocol address, Circle docs): `0x3600000000000000000000000000000000000000` (ERC-20, 6 decimals). RPC `https://rpc.mainnet.arc.io`. Explorer `https://explorer.arc.io`. Gas is also USDC; Arc drops transactions with `maxFeePerGas` below 20 gwei.

After a human deploy, set `VITE_NOVA_POOL_ADDRESS` and `VITE_NOVA_SIGNAL_ADDRESS` on the host (see `.env.example`). Optional `VITE_DEMO_BUY_TX` and `VITE_DEMO_SIGNAL_TX` surface known hashes. Until then `/demo` shows the split and disables buy.

`forge test` and `forge build` run in CI next to `pnpm quality`.

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
| Arc demo | `/demo` (public; not one of the 8 game routes) |

Home and Vote are the Cast Influence shell. Buy is Extra Influence checkout (USDC approve + `buyExtraInfluence`, shared 90/8/2 quote). Confirmation is the onchain vote lock: cast summary, Free vs Extra lanes, and the pool's close time. **See results** opens once the pool settles the day. Results is the day-settle + claim HUD. Profile is history-only. Connect is the first-run Welcome / disclaimer / browser wallet gate. Neighborhood remains a placeholder. `/demo` is the Arc mainnet money path and stays reachable when the geo gate or Connect gate is on.

After a cast, Vote offers **Review confirmation**. Purchases close for that wallet once the vote is locked. Back links and the product menu only change the route — they do not reset the day store. PlayGate still sends anyone who has not finished Connect to `/connect`.

## Setup

Requires Node 22+ and [pnpm](https://pnpm.io) 10+.

```sh
pnpm install
cp .env.example .env.local
pnpm dev
```

`pnpm dev` starts the web shell at http://127.0.0.1:43123.

## Scripts

Run from the repo root. App gates:

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Contracts (from `contracts/`, Foundry on `PATH`):

```sh
forge test
```

Same four gates as CI:

```sh
pnpm quality
```

## CI

GitHub Actions / Origin-compatible workflow: `.github/workflows/ci.yml`.

It runs on pushes to `main` and on pull requests:

1. `pnpm install --frozen-lockfile`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm test`
5. `pnpm build`
6. `forge test` and `forge build` in `contracts/`

## Browser wallet connection and testnet rehearsal

The Connect CTA now requests a real injected browser wallet (MetaMask/Rabby),
adds or switches to the configured Arc network, and follows account/network changes.
Wallet permissions are checked again on page load; a stored onboarding flag alone
cannot establish a wallet connection. Disconnect clears the app session; browser
wallet permissions can be revoked from the wallet itself.

For a local Arc testnet rehearsal set these in the root `.env.local` and restart Vite:

```dotenv
VITE_ARC_NETWORK=testnet
VITE_ARC_RPC_URL=https://rpc.testnet.arc.io
VITE_ARC_EXPLORER_URL=https://explorer.testnet.arc.io
```

Mainnet remains the default when no network is configured. There is no offline
mode: every game screen reads `NovaPool` and every action is a wallet
transaction. Buy approves at most the rest of today's 10 USDC limit, then calls
`buyExtraInfluence`; Cast calls `castVote`; Results read the latest settled day and
Claim calls `claim`. The pool is re-read every 20 seconds and when the tab regains
focus. Without `VITE_NOVA_POOL_ADDRESS` the game routes load but every action stays
disabled. Never reuse mainnet deployment addresses for testnet. Private keys are not
needed for browser connection.

Test USDC for Arc testnet comes from https://faucet.circle.com (it also pays gas).
