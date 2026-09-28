# Manual test — local walkthrough

For a human on a laptop. The game loop is the offline day. `/demo` does not need a wallet when contract addresses are empty.

**Do not** flip `tsdmrfth/nova` public. **Do not** broadcast Arc mainnet (chain id 5042). **Do not** commit private keys, funded addresses, or a filled `.env`.

## Prerequisites

- Node 22+ (`.nvmrc` is `22`)
- pnpm 10+ (this repo pins `pnpm@10.33.3`)
- Foundry (`forge`) only if you want `forge test`. Not required to click the app.

## Install and run

From the repo root. `pnpm dev` starts `@nova/web` (see root `package.json`). There is no `apps/web` README.

```sh
pnpm install
pnpm dev
```

Open http://127.0.0.1:43123

Vite reads env from `apps/web` (the directory with `vite.config.ts`). Leave `VITE_NOVA_POOL_ADDRESS` and `VITE_NOVA_SIGNAL_ADDRESS` unset. Do not add `apps/web/.env` or `apps/web/.env.local`. Root `.env.example` already leaves both blank.

## Routes to click

A first visit to Home, Vote, Buy, Confirmation, or Results sends you to `/connect`. `/demo` stays open without that gate.

1. http://127.0.0.1:43123/connect — check **I accept the rules above**, then **Continue**. No real wallet.
2. Home `/` — dismiss the +10 Free toast (or let it time out). **Skip** or **Got it** on How today works.
3. Vote `/vote` — pick Stabilize, Expand, or Route, then **Cast Influence**.
4. **Review confirmation** (`/confirmation`) — cast summary, then **See results**.
5. Results `/results` — offline day settle and the claim HUD.
6. Buy `/buy` — Spark and Pulse show the 90/8/2 quote. **Buy with USDC** on this page is mock pay (in-memory Extra), not a chain transaction.
7. `/demo` — next section. Menu **Demo**, or open the URL directly. It works if you skip Connect.

Back links and the product menu only change the route. They do not reset the day.

## `/demo` with empty addresses

No wallet.

http://127.0.0.1:43123/demo

Expect:

- Heading **One Extra Influence buy**
- Honesty copy: a story, programmable USDC on Arc, one buy, then one agent signal from the 2% operating budget. Not a general intelligence. Not affiliated with Circle.
- Split table **90% / 8% / 2%** for Spark and Pulse (Spark 0.90 / 0.08 / 0.02 USDC; Pulse 4.50 / 0.40 / 0.10 USDC)
- Signal note that there is no prize top-up
- Spark buy **disabled**, label **Mainnet deploy pending**
- Pulse buy **disabled** (**Buy Pulse · 5 USDC**)
- Copy that a human deployer fills contract addresses before a mainnet transaction

Leave **Connect wallet** unused for this check.

## Optional commands

App gates, from the repo root:

```sh
pnpm quality
```

Contract tests, from `contracts/` (Foundry on `PATH`):

```sh
forge test
```

Recorded amounts and the anvil rehearsal live in `eng/P1.5-INTERNAL-TEST.md`. Do not broadcast from `contracts/README.md`.
