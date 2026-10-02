import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { App } from "../App";
import type { Eip1193Provider } from "./arcWallet";
import { demoConfigFromEnv } from "./demoConfig";
import { GrantDemoPage } from "./GrantDemoPage";

const POOL = "0x1111111111111111111111111111111111111111";
const SIGNAL = "0x2222222222222222222222222222222222222222";
const ACCOUNT = "0x3333333333333333333333333333333333333333";

function word(value: bigint): string {
  return value.toString(16).padStart(64, "0");
}

function mockProvider(chainId = "0x13b2"): Eip1193Provider & { methods: string[] } {
  const methods: string[] = [];
  return {
    methods,
    request: async ({ method, params }) => {
      methods.push(method);
      if (method === "eth_requestAccounts" || method === "eth_accounts") return [ACCOUNT];
      if (method === "eth_chainId") return chainId;
      if (method === "wallet_switchEthereumChain") return null;
      if (method === "eth_sendTransaction") {
        const data = (params?.[0] as { data?: string } | undefined)?.data ?? "";
        return data.startsWith("0x095ea7b3")
          ? `0x${"11".repeat(32)}`
          : `0x${"22".repeat(32)}`;
      }
      if (method === "eth_call") {
        const to = (params?.[0] as { to?: string } | undefined)?.to?.toLowerCase();
        if (to === SIGNAL) {
          return `0x${word(0n)}${word(1_000_000n)}${word(0n)}${word(1_000_000n)}`;
        }
        return `0x${[1_000_000n, 900_000n, 80_000n, 20_000n, 1n, 1n, 0n, 0n, 0n].map(word).join("")}`;
      }
      return null;
    },
  };
}

describe("grant demo page", () => {
  it("is public and does not claim a live mainnet deploy", () => {
    render(
      <MemoryRouter initialEntries={["/demo"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "One Extra Influence buy" })).toBeTruthy();
    expect(screen.getByTestId("grant-honesty").textContent).toMatch(/programmable USDC/);
    expect(screen.getByTestId("grant-honesty").textContent).toMatch(/not a general intelligence/);
    expect(screen.getByTestId("grant-split").textContent).toMatch(/90%/);
    expect(screen.getByTestId("grant-split").textContent).toMatch(/8%/);
    expect(screen.getByTestId("grant-split").textContent).toMatch(/2%/);
    expect(screen.getByTestId("grant-buy-spark")).toHaveProperty("disabled", true);
    expect(screen.queryByRole("heading", { name: "Nova just woke up." })).toBeNull();
  });

  it("stays on the demo when the game geo gate is on", () => {
    render(
      <MemoryRouter initialEntries={["/demo?edge=geo"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("grant-demo")).toBeTruthy();
    expect(screen.queryByTestId("geo-block")).toBeNull();
  });

  it("connects on Arc mainnet and records a Spark buy plus explorer link", async () => {
    const user = userEvent.setup();
    const provider = mockProvider();
    const config = demoConfigFromEnv({
      VITE_NOVA_POOL_ADDRESS: POOL,
      VITE_NOVA_SIGNAL_ADDRESS: SIGNAL,
    });
    render(<GrantDemoPage config={config} provider={provider} />);

    expect(screen.queryByTestId("grant-pending-deploy")).toBeNull();
    await user.click(screen.getByTestId("grant-connect"));
    expect(screen.getByTestId("grant-account").textContent).toMatch(/chain 5042/);

    await user.click(screen.getByTestId("grant-buy-spark"));
    const link = screen.getByTestId("grant-buy-tx");
    expect(link.getAttribute("href")).toBe(
      `https://explorer.arc.io/tx/0x${"22".repeat(32)}`,
    );
    expect(screen.getByTestId("grant-ledger").textContent).toMatch(/0.9 USDC/);
    expect(screen.getByTestId("grant-ledger").textContent).toMatch(/0.08 USDC/);
    expect(screen.getByTestId("grant-ledger").textContent).toMatch(/0.02 USDC/);
    expect(screen.getByTestId("grant-signal").textContent).toMatch(/no prize top-up/);
    expect(provider.methods).toContain("eth_sendTransaction");
  });

  it("keeps buy disabled on the wrong chain", async () => {
    const user = userEvent.setup();
    const provider = mockProvider("0x1");
    render(
      <GrantDemoPage
        config={demoConfigFromEnv({
          VITE_NOVA_POOL_ADDRESS: POOL,
          VITE_NOVA_SIGNAL_ADDRESS: SIGNAL,
        })}
        provider={provider}
      />,
    );
    await user.click(screen.getByTestId("grant-connect"));
    expect(screen.getByTestId("grant-wrong-chain").textContent).toMatch(/5042/);
    expect(screen.getByTestId("grant-buy-spark")).toHaveProperty("disabled", true);
  });
});
