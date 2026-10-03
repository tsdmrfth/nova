import {
  createPublicClient,
  createWalletClient,
  custom,
  defineChain,
  http,
  TransactionReceiptNotFoundError,
  type Address,
  type Hash,
} from "viem";
import { quotePack, remainingDailyBuyMicro, type PackId } from "@nova/shared";
import { readInjectedProvider, type Eip1193Provider } from "../demo/arcWallet";
import type { DemoConfig } from "../demo/demoConfig";
import { chainErrorMessage } from "./chainErrors";
import {
  EMPTY_ENTRY,
  choiceToOption,
  optionToChoice,
  shareFor,
  type ChainEntry,
  type NovaChain,
  type OptionTotals,
} from "./novaChain";
import { ERC20_ABI, NOVA_POOL_ABI } from "./poolAbi";

/** Arc drops transactions whose maxFeePerGas is below 20 gwei. */
export const MIN_MAX_FEE_PER_GAS = 25_000_000_000n;
const RECEIPT_TIMEOUT_MS = 120_000;
/** Arc blocks land in well under a second. */
const POLLING_INTERVAL_MS = 1_000;
const PACK_ON_CHAIN: Record<PackId, number> = { spark: 1, pulse: 2 };

type EntryTuple = readonly [bigint, bigint, number, number, boolean, boolean];

function toEntry([extraBought, extraPlaced, free, option, voted, claimed]: EntryTuple): ChainEntry {
  return {
    extraBought: Number(extraBought),
    extraPlaced: Number(extraPlaced),
    free,
    option: voted ? optionToChoice(option) : null,
    voted,
    claimed,
  };
}

function toTotals(values: readonly bigint[]): OptionTotals {
  const [a = 0n, b = 0n, c = 0n] = values;
  return { A: Number(a), B: Number(b), C: Number(c) };
}

export function arcViemChain(config: DemoConfig) {
  return defineChain({
    id: config.chainId,
    name: config.chainName,
    nativeCurrency: config.nativeCurrency,
    rpcUrls: { default: { http: [config.rpcUrl] } },
    blockExplorers: { default: { name: "Arc explorer", url: config.explorerUrl } },
  });
}

/** Viem-backed pool access. Reads go to the public RPC; writes go through the browser wallet. */
export function createArcChain(
  config: DemoConfig,
  getProvider: () => Eip1193Provider | null = readInjectedProvider,
): NovaChain | null {
  if (!config.poolAddress) return null;
  const chain = arcViemChain(config);
  const client = createPublicClient({ chain, transport: http(config.rpcUrl) });
  const pool = config.poolAddress as Address;
  const usdc = config.usdcAddress as Address;

  const readEntry = async (dayId: bigint, account: string | null): Promise<ChainEntry> => {
    if (!account) return EMPTY_ENTRY;
    const row = await client.readContract({
      address: pool,
      abi: NOVA_POOL_ABI,
      functionName: "entries",
      args: [dayId, account as Address],
    });
    return toEntry(row);
  };

  const fees = async () => {
    const estimate = await client.estimateFeesPerGas().catch(() => null);
    const maxFeePerGas =
      estimate && estimate.maxFeePerGas > MIN_MAX_FEE_PER_GAS ? estimate.maxFeePerGas : MIN_MAX_FEE_PER_GAS;
    const priority = estimate?.maxPriorityFeePerGas ?? 0n;
    return { maxFeePerGas, maxPriorityFeePerGas: priority < maxFeePerGas ? priority : maxFeePerGas };
  };

  /** Wallet client bound to the account the game shows, on the configured Arc chain. */
  const walletFor = async (account: string) => {
    const provider = getProvider();
    if (!provider) throw new Error("Connect your browser wallet first.");
    const wallet = createWalletClient({ account: account as Address, chain, transport: custom(provider) });
    if ((await wallet.getChainId()) !== config.chainId) {
      throw new Error(`Switch your wallet to ${config.chainName}.`);
    }
    const accounts = await provider.request({ method: "eth_accounts" });
    if (!Array.isArray(accounts) || String(accounts[0]).toLowerCase() !== account.toLowerCase()) {
      throw new Error("Wallet account changed. Reconnect before continuing.");
    }
    return wallet;
  };

  /** Polls for the receipt right away, then every second, so a fast block confirms fast. */
  const confirm = async (hash: Hash): Promise<Hash> => {
    const deadline = Date.now() + RECEIPT_TIMEOUT_MS;
    while (Date.now() < deadline) {
      const receipt = await client.getTransactionReceipt({ hash }).catch((error: unknown) => {
        if (error instanceof TransactionReceiptNotFoundError) return null;
        throw error;
      });
      if (receipt) {
        if (receipt.status !== "success") throw new Error("Transaction reverted. Nothing changed onchain.");
        return hash;
      }
      await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL_MS));
    }
    throw new Error(`Confirmation is still pending. Check transaction ${hash} before trying again.`);
  };

  /** Simulate first so a revert shows its reason before the wallet prompt. */
  const writePool = async (
    account: string,
    call:
      | { functionName: "buyExtraInfluence"; args: readonly [number] }
      | { functionName: "castVote"; args: readonly [number, bigint, bigint] }
      | { functionName: "claim"; args: readonly [bigint] },
    fallback: string,
  ): Promise<string> => {
    try {
      const wallet = await walletFor(account);
      const { request } = await client.simulateContract({
        account: account as Address,
        address: pool,
        abi: NOVA_POOL_ABI,
        ...call,
      } as Parameters<typeof client.simulateContract>[0]);
      const hash = await wallet.writeContract({ ...request, ...(await fees()) } as Parameters<
        typeof wallet.writeContract
      >[0]);
      return await confirm(hash);
    } catch (error) {
      throw new Error(chainErrorMessage(error, fallback), { cause: error });
    }
  };

  return {
    chainName: config.chainName,
    explorerUrl: config.explorerUrl,

    async readDay(account) {
      const [dayId, open] = await Promise.all([
        client.readContract({ address: pool, abi: NOVA_POOL_ABI, functionName: "dayId" }),
        client.readContract({ address: pool, abi: NOVA_POOL_ABI, functionName: "dayOpen" }),
      ]);
      const [ledger, entry, spent] = await Promise.all([
        client.readContract({ address: pool, abi: NOVA_POOL_ABI, functionName: "days_", args: [dayId] }),
        readEntry(dayId, account),
        account
          ? client.readContract({
              address: pool,
              abi: NOVA_POOL_ABI,
              functionName: "spentOnDay",
              args: [dayId, account as Address],
            })
          : Promise.resolve(0n),
      ]);
      const [, prize, , , , , settled, rollover, , closesAt] = ledger;
      return {
        dayId: Number(dayId),
        open,
        settled,
        closesAt: closesAt === 0n ? null : Number(closesAt) * 1000,
        prize,
        rollover,
        spentMicro: spent,
        entry,
      };
    },

    async readResult(dayId, account) {
      if (dayId < 1) return null;
      const id = BigInt(dayId);
      const [ledger, tallies, entry] = await Promise.all([
        client.readContract({ address: pool, abi: NOVA_POOL_ABI, functionName: "days_", args: [id] }),
        client.readContract({ address: pool, abi: NOVA_POOL_ABI, functionName: "optionTallies", args: [id] }),
        readEntry(id, account),
      ]);
      const [, , , , paidBucket, freeBucket, settled, , rolledOut, , winner] = ledger;
      if (!settled) return null;
      const winnerId = optionToChoice(winner);
      const freeTotals = toTotals(tallies[0]);
      const extraTotals = toTotals(tallies[1]);
      return {
        dayId,
        winnerId,
        pot: paidBucket + freeBucket,
        paidBucket,
        freeBucket,
        rolledOut,
        freeTotals,
        extraTotals,
        entry,
        share: shareFor({ winnerId, paidBucket, freeBucket, freeTotals, extraTotals, entry }),
      };
    },

    async buy(account, pack) {
      const price = quotePack(pack).youPay;
      try {
        const owner = account as Address;
        const [balance, allowance, dayId] = await Promise.all([
          client.readContract({ address: usdc, abi: ERC20_ABI, functionName: "balanceOf", args: [owner] }),
          client.readContract({ address: usdc, abi: ERC20_ABI, functionName: "allowance", args: [owner, pool] }),
          client.readContract({ address: pool, abi: NOVA_POOL_ABI, functionName: "dayId" }),
        ]);
        if (balance < price) {
          throw new Error(
            config.chainId === 5042002
              ? "Not enough USDC. Get test USDC at faucet.circle.com, then try again."
              : "Not enough USDC in this wallet.",
          );
        }
        if (allowance < price) {
          const spent = await client.readContract({
            address: pool,
            abi: NOVA_POOL_ABI,
            functionName: "spentOnDay",
            args: [dayId, owner],
          });
          // One approval covers the rest of today's 10 USDC limit, never more.
          const remaining = remainingDailyBuyMicro(spent);
          const wallet = await walletFor(account);
          const hash = await wallet.writeContract({
            address: usdc,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [pool, remaining > price ? remaining : price],
            ...(await fees()),
          });
          await confirm(hash);
        }
      } catch (error) {
        throw new Error(chainErrorMessage(error, "Purchase was rejected. Try again."), { cause: error });
      }
      return writePool(
        account,
        { functionName: "buyExtraInfluence", args: [PACK_ON_CHAIN[pack]] },
        "Purchase was rejected. Try again.",
      );
    },

    castVote(account, option, free, extra) {
      return writePool(
        account,
        { functionName: "castVote", args: [choiceToOption(option), BigInt(free), BigInt(extra)] },
        "Your vote was not cast. Try again.",
      );
    },

    claim(account, dayId) {
      return writePool(
        account,
        { functionName: "claim", args: [BigInt(dayId)] },
        "Claim didn't go through. Try again.",
      );
    },
  };
}

