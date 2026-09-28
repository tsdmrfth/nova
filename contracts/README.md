# Arc mainnet demo contracts

Slim Foundry package for the Phase 1.5 Microgrant money path.

| Contract | Role |
| --- | --- |
| `NovaDemoPool` | `buyExtraInfluence` (Spark `1` / Pulse `2`), `settleDay`, budget ledger |
| `NovaSignal` | Post-settle USDC signal from the Nova operating budget only |

Buy split (matches `@nova/shared`): **90% prize / 8% studio net / 2% Nova operating budget**. Day buckets of that prize stay **90% paid / 10% free** and are a settle snapshot only — this slice does not pay winners.

`NovaSignal.signal` sends USDC to the configured Nova public wallet. Callers must be allowlisted. A hard cap is set at deploy and cannot be raised. There is no prize top-up function. Prize USDC stays in `NovaDemoPool` (claim UX is a later slice). Studio net can be withdrawn only by the immutable studio address.

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

Optional: `USDC_ADDRESS` (defaults to the Arc ERC-20 interface above), `ALLOW_NON_MAINNET=true` (rehearsal only).

After broadcast, paste the logged addresses into the root README table and into `VITE_NOVA_POOL_ADDRESS` / `VITE_NOVA_SIGNAL_ADDRESS` on the host. Those cells are placeholders until a human does that.

### Buy, settle, signal

The buyer approves the pool, then buys. Pack id `1` is Spark (1 USDC → 10 Extra). Pack id `2` is Pulse (5 USDC → 55 Extra). Daily gross cap is 10 USDC per buyer per day.

```sh
cast send "$USDC_ADDRESS" "approve(address,uint256)" "$NOVA_POOL" 1000000 \
  --rpc-url "$ARC_RPC_URL" --private-key "$BUYER_PRIVATE_KEY" --gas-price 25000000000

cast send "$NOVA_POOL" "buyExtraInfluence(uint8)" 1 \
  --rpc-url "$ARC_RPC_URL" --private-key "$BUYER_PRIVATE_KEY" --gas-price 25000000000

cast send "$NOVA_POOL" "settleDay()" \
  --rpc-url "$ARC_RPC_URL" --private-key "$OWNER_PRIVATE_KEY" --gas-price 25000000000

cast send "$NOVA_SIGNAL" "signal(uint256)" 20000 \
  --rpc-url "$ARC_RPC_URL" --private-key "$SIGNAL_AGENT_PRIVATE_KEY" --gas-price 25000000000
```

`20000` micro-USDC is the 2% budget from one Spark buy. The signal reverts before settle, above the settled budget, above the hard cap, or from a wallet that is not allowlisted. It cannot name a recipient, so it cannot pay the prize pool.

Explorer (once a human has a tx): `https://explorer.arc.io/tx/<hash>` and `https://explorer.arc.io/address/<novaWallet>`.

RPC: `https://rpc.mainnet.arc.io`. Chain id: `5042` (`0x13b2`).
