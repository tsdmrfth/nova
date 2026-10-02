import {
  PACK_ON_CHAIN,
  SNAPSHOT_SELECTOR,
  decodePoolSnapshot,
  decodeSignalSnapshot,
  encodeApprove,
  encodeBuy,
  type PoolSnapshot,
  type SignalSnapshot,
} from "./demoAbi";
import type { DemoConfig } from "./demoConfig";

export type Eip1193Provider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
};

export type BuyReceipt = {
  approveHash: string;
  buyHash: string;
};

export function readInjectedProvider(): Eip1193Provider | null {
  const eth = (globalThis as { ethereum?: Eip1193Provider }).ethereum;
  return eth ?? null;
}

export function parseChainId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const parsed = value.startsWith("0x")
    ? Number.parseInt(value, 16)
    : Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function errorCode(error: unknown): number | undefined {
  if (typeof error === "object" && error && "code" in error) {
    const code = (error as { code: unknown }).code;
    return typeof code === "number" ? code : undefined;
  }
  return undefined;
}

export function walletErrorMessage(error: unknown, fallback: string): string {
  if (errorCode(error) === 4001) return fallback;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export async function connectAccount(provider: Eip1193Provider): Promise<string> {
  const accounts = await provider.request({ method: "eth_requestAccounts" });
  if (!Array.isArray(accounts) || typeof accounts[0] !== "string") {
    throw new Error("Wallet did not return an account.");
  }
  return accounts[0];
}

export async function readChainId(provider: Eip1193Provider): Promise<number> {
  const chainId = parseChainId(await provider.request({ method: "eth_chainId" }));
  if (chainId === null) throw new Error("Wallet did not return a chain id.");
  return chainId;
}

export async function ensureArcNetwork(
  provider: Eip1193Provider,
  config: DemoConfig,
): Promise<void> {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: config.chainHex }],
    });
  } catch (error) {
    if (errorCode(error) !== 4902) throw error;
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: config.chainHex,
          chainName: config.chainName,
          nativeCurrency: config.nativeCurrency,
          rpcUrls: [config.rpcUrl],
          blockExplorerUrls: [config.explorerUrl],
        },
      ],
    });
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: config.chainHex }],
    });
  }
}

export const ensureArcMainnet = ensureArcNetwork;

async function sendTransaction(
  provider: Eip1193Provider,
  from: string,
  to: string,
  data: string,
): Promise<string> {
  const hash = await provider.request({
    method: "eth_sendTransaction",
    params: [{ from, to, data }],
  });
  if (typeof hash !== "string" || !/^0x[a-fA-F0-9]{64}$/.test(hash)) {
    throw new Error("Wallet did not return a transaction hash.");
  }
  return hash;
}

export async function waitForTransaction(
  provider: Eip1193Provider,
  hash: string,
  timeoutMs = 120_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const receipt = await provider.request({ method: "eth_getTransactionReceipt", params: [hash] });
    if (receipt && typeof receipt === "object" && "status" in receipt) {
      const status = (receipt as { status: unknown }).status;
      if (status === "0x1") return;
      if (status === "0x0") throw new Error("Transaction reverted. No purchase was credited.");
      throw new Error("Wallet returned an invalid transaction receipt.");
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Confirmation is still pending. Check transaction ${hash} before submitting again.`);
}

async function ethCall(
  provider: Eip1193Provider,
  to: string,
): Promise<string> {
  const result = await provider.request({
    method: "eth_call",
    params: [{ to, data: SNAPSHOT_SELECTOR }, "latest"],
  });
  if (typeof result !== "string") throw new Error("eth_call returned no data.");
  return result;
}

export async function sendExtraInfluenceBuy(input: {
  provider: Eip1193Provider;
  from: string;
  config: DemoConfig;
  pack: "spark" | "pulse";
  price: bigint;
}): Promise<BuyReceipt> {
  if (await readChainId(input.provider) !== input.config.chainId) {
    throw new Error(`Switch to ${input.config.chainName} before buying.`);
  }
  const accounts = await input.provider.request({ method: "eth_accounts" });
  if (!Array.isArray(accounts) || typeof accounts[0] !== "string" || accounts[0].toLowerCase() !== input.from.toLowerCase()) {
    throw new Error("Wallet account changed. Reconnect before buying.");
  }
  const pool = input.config.poolAddress;
  if (!pool) throw new Error("Pool address is not set.");
  const approveHash = await sendTransaction(
    input.provider,
    input.from,
    input.config.usdcAddress,
    encodeApprove(pool, input.price),
  );
  await waitForTransaction(input.provider, approveHash);
  if (await readChainId(input.provider) !== input.config.chainId) throw new Error("Wallet network changed before buying.");
  const currentAccounts = await input.provider.request({ method: "eth_accounts" });
  if (!Array.isArray(currentAccounts) || currentAccounts[0]?.toLowerCase() !== input.from.toLowerCase()) {
    throw new Error("Wallet account changed before buying.");
  }
  const buyHash = await sendTransaction(
    input.provider,
    input.from,
    pool,
    encodeBuy(PACK_ON_CHAIN[input.pack]),
  );
  await waitForTransaction(input.provider, buyHash);
  return { approveHash, buyHash };
}

export async function readPoolSnapshot(
  provider: Eip1193Provider,
  pool: string,
): Promise<PoolSnapshot | null> {
  return decodePoolSnapshot(await ethCall(provider, pool));
}

export async function readSignalSnapshot(
  provider: Eip1193Provider,
  signal: string,
): Promise<SignalSnapshot | null> {
  return decodeSignalSnapshot(await ethCall(provider, signal));
}
