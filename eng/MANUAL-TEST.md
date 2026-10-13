# Manual test — local walkthrough

For a human on a laptop. The game loop runs on `NovaPool` through a browser wallet (MetaMask or Rabby); there is no offline mode. `/demo` does not need a wallet when contract addresses are empty.

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

Vite reads env from the **repo root** (`envDir: "../.."` in `apps/web/vite.config.ts`); `apps/web/.env.local` is ignored. For the game loop, put the Arc **testnet** `NovaPool` / `NovaSignal` addresses in the gitignored root `.env.local`, then restart `pnpm dev`:

```dotenv
VITE_ARC_NETWORK=testnet
VITE_NOVA_POOL_ADDRESS=0x…
VITE_NOVA_SIGNAL_ADDRESS=0x…
```

Fund two test wallets from https://faucet.circle.com (USDC pays gas on Arc). Without a pool address the game screens load but every action stays disabled.

## Routes to click

A first visit to Home, Vote, Buy, Confirmation, or Results sends you to `/connect`. `/demo` stays open without that gate.

1. http://127.0.0.1:43123/connect — **Connect Arc wallet**. The wallet asks for access and to add/switch to Arc Testnet. The soft-launch notice opens: check **I understand this is a soft launch**, then **Enter Nova**. A wallet on another chain shows **Switch to Arc**.
2. Home `/` — the Free Influence +10 toast holds ~2.4s (tap to dismiss). **Skip** or **Got it** on How today works.
3. Tap a choice card (or **Choose and vote**) to open Vote `/vote`. Set the Free and Extra steppers, then **Cast Influence on {pick}** and confirm `castVote` in the wallet. Reject once to see the error stay on Vote.
4. Vote locked (`/confirmation`) — spent/remaining per lane, read back from the pool. **See results** stays disabled until the operator settles.
5. Operator settles: `cast send "$NOVA_POOL" "settleDay()" …` (see `contracts/README.md`). Refocus the tab; Results open.
6. Results `/results` — Matched or Not this round from the pool's W*. **Claim** → wallet → Claim pending → USDC claimed with an explorer link. Reject in the wallet to see **Claim didn't go through** + **Retry**.
7. Buy `/buy` — tap the **EXTRA** chip on Home/Vote, before you cast. Spark and Pulse show the 90/8/2 quote. **Confirm buy** asks for one USDC approval (rest of today's 10 USDC limit) the first time, then `buyExtraInfluence`. Reload: Extra and spent-today come back from the pool. After the vote, Confirm buy stays off: purchases close once you vote.
8. Second wallet: vote a different option, settle, and check both Results screens against `cast call "$NOVA_POOL" "claimable(uint256,address)(uint256,uint256)" 1 <wallet>`.
9. Pause: operator `cast send "$NOVA_POOL" "pause()" …`. Buy and Vote fail with **Nova is paused for a moment…**; Claim on a settled day still pays. The owner (`unpause()`) brings play back; the operator gets `NotOwner` if it tries.
10. **MENU** chip on Home — day history, Daily reminder / Calm motion toggles, Help (tutorial, pools, soft-launch notice), Disconnect.
11. `/demo` — next section. Open the URL directly (dev builds also show a **Routes** jumper bottom-left). It works if you skip Connect.

Back links and the dev route jumper only change the route. They do not reset the day.

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
