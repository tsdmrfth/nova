import { describe, expect, it, vi } from "vitest";
import { sendExtraInfluenceBuy, waitForTransaction } from "./arcWallet";
import { demoConfigFromEnv } from "./demoConfig";

const account = "0x" + "11".repeat(20);
const hash = "0x" + "22".repeat(32);
describe("real purchase confirmations", () => {
  it("does not submit a buy after approval reverts", async () => {
    const request = vi.fn(async ({ method }: { method: string }) => {
      if (method === "eth_chainId") return "0x13b2";
      if (method === "eth_accounts") return [account];
      if (method === "eth_sendTransaction") return hash;
      if (method === "eth_getTransactionReceipt") return { status: "0x0" };
      throw new Error(method);
    });
    await expect(sendExtraInfluenceBuy({ provider: { request }, from: account,
      config: demoConfigFromEnv({ VITE_NOVA_POOL_ADDRESS: account }), pack: "spark", price: 1_000_000n,
    })).rejects.toThrow("reverted");
    expect(request.mock.calls.filter(([args]) => args.method === "eth_sendTransaction")).toHaveLength(1);
  });
  it("rejects reverted and malformed receipts", async () => {
    for (const status of ["0x0", "unknown"]) {
      await expect(waitForTransaction({ request: async () => ({ status }) }, hash)).rejects.toThrow();
    }
  });
});
