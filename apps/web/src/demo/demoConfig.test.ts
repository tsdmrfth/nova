import { describe, expect, it } from "vitest";
import {
  ARC_MAINNET_CHAIN_ID,
  ARC_USDC_ADDRESS,
  contractsDeployed,
  demoConfigFromEnv,
  explorerTxUrl,
} from "./demoConfig";

describe("demo config", () => {
  it("defaults to Arc mainnet placeholders and ignores blank addresses", () => {
    const config = demoConfigFromEnv({});
    expect(config.chainId).toBe(ARC_MAINNET_CHAIN_ID);
    expect(config.chainHex).toBe("0x13b2");
    expect(config.usdcAddress).toBe(ARC_USDC_ADDRESS);
    expect(config.rpcUrl).toBe("https://rpc.mainnet.arc.io");
    expect(config.explorerUrl).toBe("https://explorer.arc.io");
    expect(config.poolAddress).toBeNull();
    expect(config.signalAddress).toBeNull();
    expect(contractsDeployed(config)).toBe(false);
  });

  it("rejects zero and malformed addresses so a placeholder cannot broadcast", () => {
    const config = demoConfigFromEnv({
      VITE_NOVA_POOL_ADDRESS: "0x0000000000000000000000000000000000000000",
      VITE_NOVA_SIGNAL_ADDRESS: "not-an-address",
      VITE_DEMO_BUY_TX: "0x1234",
    });
    expect(config.poolAddress).toBeNull();
    expect(config.signalAddress).toBeNull();
    expect(config.sampleBuyTx).toBeNull();
  });

  it("accepts a human-filled pool, signal, and sample tx", () => {
    const pool = "0x1111111111111111111111111111111111111111";
    const signal = "0x2222222222222222222222222222222222222222";
    const tx = `0x${"ab".repeat(32)}`;
    const config = demoConfigFromEnv({
      VITE_NOVA_POOL_ADDRESS: pool,
      VITE_NOVA_SIGNAL_ADDRESS: signal,
      VITE_DEMO_SIGNAL_TX: tx,
    });
    expect(contractsDeployed(config)).toBe(true);
    expect(explorerTxUrl(config.explorerUrl, tx)).toBe(
      `https://explorer.arc.io/tx/${tx}`,
    );
  });
});
