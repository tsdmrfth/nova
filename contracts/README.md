# Arc mainnet demo contracts

Slim Foundry package for the Phase 1.5 Microgrant money path.

| Contract | Role |
| --- | --- |
| `NovaDemoPool` | `buyExtraInfluence` (Spark `1` / Pulse `2`), `castVote`, `settleDay` (onchain W*), `claim`, budget ledger |
| `NovaSignal` | Post-settle USDC signal from the Nova operating budget only |

Buy split (matches `@nova/shared`): **90% prize / 8% studio net / 2% Nova operating budget**. Day buckets of the day's prize (plus rollover) stay **90% paid / 10% free**.

### Day loop (v2)

1. **Buy** — `buyExtraInfluence(packId)`; Extra is per wallet per day. Buys after a vote land on that vote's option.
2. **Vote** — `castVote(option, free, extra)`, option `0/1/2` = A/B/C. One vote per wallet per day; Free ≤ 10 (the daily grant), Extra ≤ what that wallet bought today.
3. **Settle** — owner `settleDay()`. W* is picked onchain from Free tallies only (day 1 MOST, day 2 LEAST, day 3 MIDDLE, …; ties go to the lower option). If the day has a `closesAt`, settle waits for it.
4. **Claim** — each winner pulls `claim(dayId)`: paid = paidBucket × min(Extra, 100) / Σ, free = freeBucket × Free / Σ (floor). An empty winner lane rolls its whole bucket into the next day. Floor dust stays in `prizePool`, unassigned.
5. **Next day** — owner `openNextDay(closesAt)`; `closesAt` is unix seconds, or `0` to close by settling. `setDayClose(closesAt)` moves today's close.

`NovaSignal.signal` sends USDC to the configured Nova public wallet. Callers must be allowlisted. A hard cap is set at deploy and cannot be raised. There is no prize top-up function. Prize USDC leaves `NovaDemoPool` only through winners' claims. Studio net can be withdrawn only by the immutable studio address.

v2 changes the `openNextDay` signature and the `days_` getter, so a v1 pool cannot serve the current web app; redeploy both contracts.

## Test

```sh
forge test
```

From the repo root, `forge` must be on `PATH` (Foundry).

## Mainnet deploy

Arc **mainnet** (chain id **5042**) is the Microgrant target. A testnet-only deploy does **not** satisfy submit. This repo does not contain a deployer key, a funded wallet, or a live host. The script refuses every chain other than 5042 unless you explicitly set `ALLOW_NON_MAINNET=true` for a local rehearsal.

Public protocol constant (Circle docs, not a secret): ERC-20 USDC on Arc is `0x3600000000000000000000000000000000000000` (6 decimals). Gas on Arc is also USDC, accounted at 18 decimals on the native balance. This pool uses the 6-decimal ERC-20 interface only.

Copy `contracts/.env.example` to a gitignored env file and fill the placeholders. Never commit private keys.

```sh
set -a
source contracts/.env
set +a

forge script script/DeployArcMainnet.s.sol \
  --rpc-url "$ARC_RPC_URL" \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  --broadcast \
  --gas-price 25000000000
```

`--gas-price` is in wei. Arc drops transactions whose `maxFeePerGas` is below 20 gwei, so the example uses 25 gwei. Prefer a hardware wallet or Foundry keystore (`--account`) over a raw key on disk.

Required env:

| Name | Meaning |
| --- | --- |
| `DEPLOYER_PRIVATE_KEY` | Broadcast key. Not read by Solidity. Not committed. |
| `STUDIO_ADDRESS` | Receives studio-net withdrawals |
| `NOVA_WALLET` | Public Arc address that receives the signal |
| `SIGNAL_CAP_MICRO` | Hard cap in micro-USDC (6 decimals), e.g. `1000000` = 1 USDC |
| `OWNER_ADDRESS` | Settles days, rotates the allowlist and Nova wallet |
| `SIGNAL_AGENT` | First allowlisted caller of `signal` |

Optional: `USDC_ADDRESS` (defaults to the Arc ERC-20 interface above), `ALLOW_NON_MAINNET=true` (rehearsal only), `FIRST_DAY_CLOSES_AT` (unix seconds for day 1's vote close; needs the deployer to be `OWNER_ADDRESS`).

After broadcast, paste the logged addresses into the root README table and into `VITE_NOVA_POOL_ADDRESS` / `VITE_NOVA_SIGNAL_ADDRESS` on the host. Those cells are placeholders until a human does that.

### Buy, vote, settle, claim, signal

The buyer approves the pool, then buys. Pack id `1` is Spark (1 USDC → 10 Extra). Pack id `2` is Pulse (5 USDC → 55 Extra). Daily gross cap is 10 USDC per buyer per day.

```sh
cast send "$USDC_ADDRESS" "approve(address,uint256)" "$NOVA_POOL" 1000000 \
  --rpc-url "$ARC_RPC_URL" --private-key "$BUYER_PRIVATE_KEY" --gas-price 25000000000

cast send "$NOVA_POOL" "buyExtraInfluence(uint8)" 1 \
  --rpc-url "$ARC_RPC_URL" --private-key "$BUYER_PRIVATE_KEY" --gas-price 25000000000

cast send "$NOVA_POOL" "castVote(uint8,uint256,uint256)" 1 10 10 \
  --rpc-url "$ARC_RPC_URL" --private-key "$BUYER_PRIVATE_KEY" --gas-price 25000000000

cast send "$NOVA_POOL" "settleDay()" \
  --rpc-url "$ARC_RPC_URL" --private-key "$OWNER_PRIVATE_KEY" --gas-price 25000000000

cast call "$NOVA_POOL" "claimable(uint256,address)(uint256,uint256)" 1 "$BUYER" --rpc-url "$ARC_RPC_URL"
cast send "$NOVA_POOL" "claim(uint256)" 1 \
  --rpc-url "$ARC_RPC_URL" --private-key "$BUYER_PRIVATE_KEY" --gas-price 25000000000

# Next day closes 24h from now.
cast send "$NOVA_POOL" "openNextDay(uint64)" "$(( $(date +%s) + 86400 ))" \
  --rpc-url "$ARC_RPC_URL" --private-key "$OWNER_PRIVATE_KEY" --gas-price 25000000000

cast send "$NOVA_SIGNAL" "signal(uint256)" 20000 \
  --rpc-url "$ARC_RPC_URL" --private-key "$SIGNAL_AGENT_PRIVATE_KEY" --gas-price 25000000000
```

`20000` micro-USDC is the 2% budget from one Spark buy. The signal reverts before settle, above the settled budget, above the hard cap, or from a wallet that is not allowlisted. It cannot name a recipient, so it cannot pay the prize pool.

Explorer (once a human has a tx): `https://explorer.arc.io/tx/<hash>` and `https://explorer.arc.io/address/<novaWallet>`.

RPC: `https://rpc.mainnet.arc.io`. Chain id: `5042` (`0x13b2`).

### Web client against anvil

`apps/web/src/chain/arcChain.anvil.test.ts` drives the real viem client (approve, buy, vote, settle, claim, revert copy) against a local pool. It is skipped unless the env below is set.

```sh
anvil --chain-id 5042002 --port 8546
# deployer = anvil account 0 (owner + studio)
forge create test/NovaDemo.t.sol:MockUSDC --rpc-url http://127.0.0.1:8546 --private-key "$ANVIL_KEY_0" --broadcast
forge create src/NovaDemoPool.sol:NovaDemoPool --rpc-url http://127.0.0.1:8546 --private-key "$ANVIL_KEY_0" --broadcast \
  --constructor-args "$MOCK_USDC" "$ANVIL_ADDR_0" "$ANVIL_ADDR_0"
cast send "$MOCK_USDC" "mint(address,uint256)" 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 20000000 \
  --rpc-url http://127.0.0.1:8546 --private-key "$ANVIL_KEY_0"

NOVA_ANVIL_RPC=http://127.0.0.1:8546 NOVA_ANVIL_POOL="$POOL" NOVA_ANVIL_USDC="$MOCK_USDC" \
  pnpm vitest run apps/web/src/chain/arcChain.anvil.test.ts
```

Use a fresh pool per run: the test expects day 1 to be open.
