# Nova contracts

Foundry package for Nova's Arc money path. The same code ships to Arc testnet (rehearsal) and Arc mainnet (live); each network gets its own deploy and its own addresses.

| Contract | Role |
| --- | --- |
| `NovaPool` | `buyExtraInfluence` (Spark `1` / Pulse `2`), `castVote`, `settleDay` (onchain W*), `claim`, budget ledger |
| `NovaSignal` | Post-settle USDC signal from the Nova operating budget only |

Buy split (matches `@nova/shared`): **90% prize / 8% studio net / 2% Nova operating budget**. Day buckets of the day's prize (plus rollover) stay **90% paid / 10% free**.

### Day loop

1. **Buy** — `buyExtraInfluence(packId)`; Extra is per wallet per day, and only before that wallet votes. A buy after `castVote` reverts `PurchaseClosed`.
2. **Vote** — `castVote(option, free, extra)`, option `0/1/2` = A/B/C. One vote per wallet per day; Free ≤ 10 (the daily grant), Extra ≤ what that wallet bought today.
3. **Settle** — operator `settleDay()`. W* is picked onchain from Free tallies only (day 1 MOST, day 2 LEAST, day 3 MIDDLE, …; ties go to the lower option). If the day has a `closesAt`, settle waits for it.
4. **Claim** — each winner pulls `claim(dayId)`: paid = paidBucket × min(Extra, 100) / Σ, free = freeBucket × Free / Σ (floor). An empty winner lane rolls its whole bucket into the next day. Floor dust stays in `prizePool`, unassigned.
5. **Next day** — operator `openNextDay(closesAt)`; `closesAt` is unix seconds, or `0` to close by settling. `setDayClose(closesAt)` moves today's close.

`NovaSignal.signal` sends USDC to the configured Nova public wallet. Callers must be allowlisted. A hard cap is set at deploy and cannot be raised. There is no prize top-up function. Prize USDC leaves `NovaPool` only through winners' claims. Studio net can be withdrawn only by the immutable studio address.

### Roles

| Role | Who | Can |
| --- | --- | --- |
| `owner` | A Safe multisig on mainnet | `setOperator`, `setSignal` (once), `unpause`, two-step `transferOwnership` / `acceptOwnership`; everything the operator can do. On `NovaSignal`: allowlist, Nova wallet, ownership. |
| `operator` | A hot key or bot | `settleDay`, `openNextDay`, `setDayClose`, `pause` |
| `studio` | Immutable | `withdrawStudioNet` |
| `signal` | `NovaSignal`, set once | `releaseNovaBudget` |

No role can move prize USDC, change the split, or pick the winner. `pause` stops buys and votes only; claims, studio withdrawals and the signal keep working, and only the owner can unpause. A lost operator key never strands a day, because the owner can run the loop too.

Canonical Safe v1.4.1 (`SafeL2` `0x29fcB43b46531BcA003ddC8FCB67FFE91900C762`, `SafeProxyFactory` `0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67`) is deployed on both Arc mainnet and testnet (checked with `cast codesize`).

### Upgrades

The contracts are not upgradeable, on purpose: players can read exactly the code that holds their USDC, and nobody can swap it. A rule change ships as a new `NovaPool` + `NovaSignal`:

1. Operator settles the last day on the old pool and stops opening new days (or the owner pauses it).
2. Deploy the new pair, point `VITE_NOVA_POOL_ADDRESS` / `VITE_NOVA_SIGNAL_ADDRESS` at it.
3. The old pool stays live for claims forever. Rollover and floor dust left in it stay there; nobody can sweep them.

v1 → v2 changed `openNextDay` and the `days_` getter, and v2 → `NovaPool` added the operator role, pause, and two-step ownership. Every earlier pool is incompatible with the current web app.

## Test

```sh
forge test
```

From the repo root, `forge` must be on `PATH` (Foundry). Three suites:

- `test/NovaPool.t.sol` — unit and fuzz tests for the split, buys, votes, settle, claims, roles, pause, ownership, and an Arc USDC blocklist case.
- `test/NovaPool.invariant.t.sol` — a handler drives random days (buy, vote, settle, open, claim, withdraw, signal, pause/unpause; 256 runs × 100 calls). Invariants: the ledger is conserved, the pool's USDC balance equals prize + studio net + budget exactly, the spendable budget never exceeds the budget, and no day pays out more than its pot minus rollover.

Static analysis (no install needed with `uv`):

```sh
uvx --python 3.12 --from slither-analyzer slither . --filter-paths 'lib|test|script' --exclude-informational
```

Expected leftovers, all reviewed: `timestamp` (day close is hours-scale; Arc timestamps are non-decreasing at 1 s), `missing-zero-check` on `transferOwnership` (address(0) cancels), `uninitialized-local` (zero is the intended start).

## Arc specifics

From the Arc docs ([EVM differences](https://docs.arc.io/arc/references/evm-differences.md), [porting checklist](https://docs.arc.io/arc/tutorials/porting-contracts-to-arc.md)) and Circle's `use-arc` skill:

- **One USDC, two views.** ERC-20 at `0x3600000000000000000000000000000000000000` (6 decimals) and native gas (18 decimals) are the same balance. `NovaPool` only uses the ERC-20 view, is nonpayable, and never reads `address(this).balance`, so a native send or a stray transfer cannot change the ledger.
- **Blocklist.** USDC transfers to or from a blocklisted address revert. A blocked winner's `claim` reverts and their share stays in the pool; other winners are unaffected (`test_blockedWinnerDoesNotBlockOthers`). If `studio` is ever blocked, studio net stays put.
- **No randomness.** `PREVRANDAO` is always 0 on Arc. W* is deterministic from the Free tallies, so nothing here depends on it.
- **Time.** Block timestamps are non-decreasing at one-second granularity, and several sub-second blocks can share one. `closesAt` comparisons are fine at that resolution.
- **Fees.** The mempool drops transactions with `maxFeePerGas` below 20 gwei, with no error. Every command below sets 25 gwei.
- **Finality.** Sub-second and deterministic; one confirmation is final.

## Deploy

`script/DeployNova.s.sol` targets Arc mainnet (chain id **5042**) and refuses any other chain unless `ALLOW_NON_MAINNET=true` (testnet and anvil rehearsals). This repo does not contain a deployer key, a funded wallet, or a live host.

The broadcaster owns both contracts while it wires them (`setSignal`, optional `setDayClose`), then starts a two-step hand-over to `OWNER_ADDRESS`. Until that address calls `acceptOwnership()` on **both** contracts, the deployer is still the owner. With a Safe, that is two Safe transactions (or one batched via the Transaction Builder).

Use a Foundry keystore, not a raw key on the command line (Circle `use-arc` security rule):

```sh
cast wallet import nova-deployer --interactive   # once

set -a
source contracts/.env.local
set +a

forge script script/DeployNova.s.sol \
  --rpc-url "$ARC_RPC_URL" \
  --account nova-deployer \
  --broadcast \
  --gas-price 25000000000
```

`--gas-price` is in wei. For testnet add `ALLOW_NON_MAINNET=true` and use `ARC_RPC_URL=https://rpc.testnet.arc.io`.

Required env:

| Name | Meaning |
| --- | --- |
| `STUDIO_ADDRESS` | Receives studio-net withdrawals. Immutable. |
| `NOVA_WALLET` | Public Arc address that receives the signal |
| `SIGNAL_CAP_MICRO` | Hard cap in micro-USDC (6 decimals), e.g. `1000000` = 1 USDC |
| `OWNER_ADDRESS` | Final owner of both contracts (a Safe on mainnet). Must `acceptOwnership()` unless it is the deployer. |
| `OPERATOR_ADDRESS` | Runs the day loop: settle, open next day, set close, pause |
| `SIGNAL_AGENT` | First allowlisted caller of `signal` |

Optional: `USDC_ADDRESS` (defaults to the Arc ERC-20 interface above), `ALLOW_NON_MAINNET=true` (testnet / anvil only), `FIRST_DAY_CLOSES_AT` (unix seconds for day 1's vote close).

After broadcast, paste the logged addresses into the root README table and into `VITE_NOVA_POOL_ADDRESS` / `VITE_NOVA_SIGNAL_ADDRESS` on the host. Those cells are placeholders until a human does that.

### Release checklist

Run this for every new pool, testnet first, then mainnet from the same commit:

1. `forge test` green (unit, fuzz, invariant) and Slither shows only the reviewed leftovers above.
2. Anvil rehearsal of `DeployNova.s.sol` with `OWNER_ADDRESS` ≠ deployer; `acceptOwnership()` from the owner; check `owner`, `pendingOwner`, `operator`, `signal`, `days_(1).closesAt` with `cast call`.
3. Testnet deploy, then the walkthrough in `eng/MANUAL-TEST.md` (buy, vote, settle, claim, pause/unpause, signal).
4. Tag the commit; mainnet deploy from that tag with the Safe as `OWNER_ADDRESS`; the Safe accepts ownership of both contracts.
5. Verify the source on the explorer (`forge verify-contract`) and record both addresses and the deploy tx in the root README.
6. Before real volume beyond the Microgrant demo caps: an external audit.

### Buy, vote, settle, claim, signal

The buyer approves the pool, then buys. Pack id `1` is Spark (1 USDC → 10 Extra). Pack id `2` is Pulse (5 USDC → 55 Extra). Daily gross cap is 10 USDC per buyer per day.

```sh
cast send "$USDC_ADDRESS" "approve(address,uint256)" "$NOVA_POOL" 1000000 \
  --rpc-url "$ARC_RPC_URL" --account buyer --gas-price 25000000000

cast send "$NOVA_POOL" "buyExtraInfluence(uint8)" 1 \
  --rpc-url "$ARC_RPC_URL" --account buyer --gas-price 25000000000

cast send "$NOVA_POOL" "castVote(uint8,uint256,uint256)" 1 10 10 \
  --rpc-url "$ARC_RPC_URL" --account buyer --gas-price 25000000000

cast send "$NOVA_POOL" "settleDay()" \
  --rpc-url "$ARC_RPC_URL" --account nova-operator --gas-price 25000000000

cast call "$NOVA_POOL" "claimable(uint256,address)(uint256,uint256)" 1 "$BUYER" --rpc-url "$ARC_RPC_URL"
cast send "$NOVA_POOL" "claim(uint256)" 1 \
  --rpc-url "$ARC_RPC_URL" --account buyer --gas-price 25000000000

# Next day closes 24h from now.
cast send "$NOVA_POOL" "openNextDay(uint64)" "$(( $(date +%s) + 86400 ))" \
  --rpc-url "$ARC_RPC_URL" --account nova-operator --gas-price 25000000000

cast send "$NOVA_SIGNAL" "signal(uint256)" 20000 \
  --rpc-url "$ARC_RPC_URL" --account nova-agent --gas-price 25000000000

# Emergency: the operator pauses buys and votes; only the owner (Safe) unpauses.
cast send "$NOVA_POOL" "pause()" \
  --rpc-url "$ARC_RPC_URL" --account nova-operator --gas-price 25000000000
```

`20000` micro-USDC is the 2% budget from one Spark buy. The signal reverts before settle, above the settled budget, above the hard cap, or from a wallet that is not allowlisted. It cannot name a recipient, so it cannot pay the prize pool.

Explorer (once a human has a tx): `https://explorer.arc.io/tx/<hash>` and `https://explorer.arc.io/address/<novaWallet>`. Testnet: `https://explorer.testnet.arc.io`.

RPC: `https://rpc.mainnet.arc.io`. Chain id: `5042` (`0x13b2`). Testnet: `https://rpc.testnet.arc.io`, chain id `5042002`.

### Web client against anvil

`apps/web/src/chain/arcChain.anvil.test.ts` drives the real viem client (approve, buy, vote, settle, claim, revert copy) against a local pool. It is skipped unless the env below is set.

```sh
anvil --chain-id 5042002 --port 8546
# deployer = anvil account 0 (owner + operator + studio)
forge create test/NovaPool.t.sol:MockUSDC --rpc-url http://127.0.0.1:8546 --private-key "$ANVIL_KEY_0" --broadcast
forge create src/NovaPool.sol:NovaPool --rpc-url http://127.0.0.1:8546 --private-key "$ANVIL_KEY_0" --broadcast \
  --constructor-args "$MOCK_USDC" "$ANVIL_ADDR_0" "$ANVIL_ADDR_0" "$ANVIL_ADDR_0"
cast send "$MOCK_USDC" "mint(address,uint256)" 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 20000000 \
  --rpc-url http://127.0.0.1:8546 --private-key "$ANVIL_KEY_0"

NOVA_ANVIL_RPC=http://127.0.0.1:8546 NOVA_ANVIL_POOL="$POOL" NOVA_ANVIL_USDC="$MOCK_USDC" \
  pnpm vitest run apps/web/src/chain/arcChain.anvil.test.ts
```

Use a fresh pool per run: the test expects day 1 to be open. Anvil's raw dev keys are fine here; they hold nothing.
