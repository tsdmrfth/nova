import { encodeFunctionData } from "viem";
import { describe, expect, it } from "vitest";
import type { Eip1193Provider } from "../demo/arcWallet";
import { demoConfigFromEnv } from "../demo/demoConfig";
import { createArcChain } from "./arcChain";

/**
 * Drives the real viem pool client against a local anvil node running NovaPool.
 * Opt-in: set NOVA_ANVIL_RPC, NOVA_ANVIL_POOL and NOVA_ANVIL_USDC (see contracts/README.md).
 * Anvil's default accounts are unlocked, so eth_sendTransaction stands in for the wallet.
 */
const rpc = process.env.NOVA_ANVIL_RPC;
const pool = process.env.NOVA_ANVIL_POOL;
const usdc = process.env.NOVA_ANVIL_USDC;

const OWNER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const PLAYER = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const OTHER = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";

async function call(method: string, params: unknown[] = []): Promise<unknown> {
  const response = await fetch(rpc ?? "", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const body = (await response.json()) as { result?: unknown; error?: { code: number; message: string } };
  if (body.error) throw Object.assign(new Error(body.error.message), { code: body.error.code });
  return body.result;
}

function walletOf(account: string): Eip1193Provider {
  return {
    request: ({ method, params }) =>
      method === "eth_accounts" || method === "eth_requestAccounts"
        ? Promise.resolve([account])
        : call(method, params),
  };
}

async function ownerSend(functionName: "settleDay") {
  const data = encodeFunctionData({
    abi: [{ type: "function", name: functionName, stateMutability: "nonpayable", inputs: [], outputs: [] }],
    functionName,
  });
  const hash = await call("eth_sendTransaction", [{ from: OWNER, to: pool, data }]);
  for (let i = 0; i < 50; i += 1) {
    const receipt = (await call("eth_getTransactionReceipt", [hash])) as { status: string } | null;
    if (receipt) {
      if (receipt.status !== "0x1") throw new Error(`${functionName} reverted`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`${functionName} was not mined`);
}

describe.skipIf(!rpc || !pool || !usdc)("arc chain client on anvil", () => {
  const config = demoConfigFromEnv({
    VITE_ARC_NETWORK: "testnet",
    VITE_ARC_RPC_URL: rpc,
    VITE_ARC_USDC_ADDRESS: usdc,
    VITE_NOVA_POOL_ADDRESS: pool,
  });

  it("buys, votes, settles and claims through viem", { timeout: 60_000 }, async () => {
    let wallet = walletOf(PLAYER);
    const chain = createArcChain(config, () => wallet);
    if (!chain) throw new Error("pool not configured");

    const fresh = await chain.readDay(PLAYER);
    expect(fresh).toMatchObject({ dayId: 1, open: true, settled: false, closesAt: null });

    // First buy approves the rest of today's cap, then buys.
    expect(await chain.buy(PLAYER, "spark")).toMatch(/^0x[0-9a-f]{64}$/);
    await chain.buy(PLAYER, "spark");
    const bought = await chain.readDay(PLAYER);
    expect(bought.spentMicro).toBe(2_000_000n);
    expect(bought.entry.extraBought).toBe(20);

    await chain.castVote(PLAYER, "B", 10, 15);
    await expect(chain.castVote(PLAYER, "A", 1, 0)).rejects.toThrow("This wallet has already voted today.");
    expect((await chain.readDay(PLAYER)).entry).toMatchObject({ voted: true, option: "B", free: 10, extraPlaced: 15 });

    wallet = walletOf(OTHER);
    await chain.castVote(OTHER, "A", 5, 0);
    wallet = walletOf(PLAYER);

    expect(await chain.readResult(1, PLAYER)).toBeNull();
    expect(await chain.readWinners(1)).toEqual([]);
    await ownerSend("settleDay");

    const result = await chain.readResult(1, PLAYER);
    expect(result).toMatchObject({ dayId: 1, winnerId: "B", pot: 1_800_000n, rolledOut: 0n });
    expect(await chain.readWinners(1)).toEqual([{ day: 1, winner: "B" }]);
    expect(result?.share).toEqual({ paid: 1_620_000n, free: 180_000n, total: 1_800_000n });
    await expect(chain.buy(PLAYER, "spark")).rejects.toThrow(/round is closed/);

    await chain.claim(PLAYER, 1);
    expect((await chain.readResult(1, PLAYER))?.entry.claimed).toBe(true);
    await expect(chain.claim(PLAYER, 1)).rejects.toThrow("This payout was already claimed.");
  });

  it("refuses to write from a wallet on another account", async () => {
    const chain = createArcChain(config, () => walletOf(OTHER));
    if (!chain) throw new Error("pool not configured");
    await expect(chain.castVote(PLAYER, "A", 1, 0)).rejects.toThrow(/Wallet account changed/);
  });
});
