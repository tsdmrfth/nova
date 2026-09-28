export const ARC_MAINNET_CHAIN_ID = 5042;
export const ARC_MAINNET_CHAIN_HEX = "0x13b2";
/** Circle docs: ERC-20 USDC interface on Arc, 6 decimals. */
export const ARC_USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
export const ARC_DEFAULT_RPC = "https://rpc.mainnet.arc.io";
export const ARC_DEFAULT_EXPLORER = "https://explorer.arc.io";

const ZERO = "0x0000000000000000000000000000000000000000";

export type DemoConfig = {
  chainId: number;
  chainHex: string;
  chainName: string;
  rpcUrl: string;
  explorerUrl: string;
  usdcAddress: string;
  poolAddress: string | null;
  signalAddress: string | null;
  sampleBuyTx: string | null;
  sampleSignalTx: string | null;
  nativeCurrency: { name: string; symbol: string; decimals: number };
};

export type DemoEnv = {
  VITE_ARC_RPC_URL?: string;
  VITE_ARC_EXPLORER_URL?: string;
  VITE_ARC_USDC_ADDRESS?: string;
  VITE_NOVA_POOL_ADDRESS?: string;
  VITE_NOVA_SIGNAL_ADDRESS?: string;
  VITE_DEMO_BUY_TX?: string;
  VITE_DEMO_SIGNAL_TX?: string;
};

function readAddress(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return null;
  if (trimmed.toLowerCase() === ZERO) return null;
  return trimmed;
}

function readTx(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^0x[a-fA-F0-9]{64}$/.test(trimmed)) return null;
  return trimmed;
}

export function demoConfigFromEnv(env: DemoEnv): DemoConfig {
  return {
    chainId: ARC_MAINNET_CHAIN_ID,
    chainHex: ARC_MAINNET_CHAIN_HEX,
    chainName: "Arc",
    rpcUrl: env.VITE_ARC_RPC_URL?.trim() || ARC_DEFAULT_RPC,
    explorerUrl: (env.VITE_ARC_EXPLORER_URL?.trim() || ARC_DEFAULT_EXPLORER).replace(
      /\/$/,
      "",
    ),
    usdcAddress: readAddress(env.VITE_ARC_USDC_ADDRESS) ?? ARC_USDC_ADDRESS,
    poolAddress: readAddress(env.VITE_NOVA_POOL_ADDRESS),
    signalAddress: readAddress(env.VITE_NOVA_SIGNAL_ADDRESS),
    sampleBuyTx: readTx(env.VITE_DEMO_BUY_TX),
    sampleSignalTx: readTx(env.VITE_DEMO_SIGNAL_TX),
    nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  };
}

export function readDemoConfig(): DemoConfig {
  return demoConfigFromEnv(import.meta.env);
}

export function contractsDeployed(config: DemoConfig): boolean {
  return Boolean(config.poolAddress && config.signalAddress);
}

export function explorerTxUrl(explorer: string, hash: string): string {
  return `${explorer}/tx/${hash}`;
}

export function explorerAddressUrl(explorer: string, address: string): string {
  return `${explorer}/address/${address}`;
}
