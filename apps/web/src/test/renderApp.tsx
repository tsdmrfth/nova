import { act, render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { vi } from "vitest";
import { App } from "../App";
import type { NovaChain } from "../chain/novaChain";
import { readDemoConfig } from "../demo/demoConfig";
import { FakeNovaChain } from "./fakeChain";

export const PLAYER = "0xF2FDeE747478A34deaf79811A4f87581dc01bBBD";

/**
 * Injects a browser wallet on the configured Arc chain. `authorized: false` is a wallet
 * that has never approved this site, so it shares no account until Connect.
 */
export function stubConnectedWallet(account: string = PLAYER, authorized = true) {
  const chainHex = readDemoConfig().chainHex;
  let shared = authorized;
  const request = vi.fn(async ({ method }: { method: string }) => {
    if (method === "eth_requestAccounts") shared = true;
    if (method === "eth_accounts" || method === "eth_requestAccounts") return shared ? [account] : [];
    if (method === "eth_chainId") return chainHex;
    return null;
  });
  vi.stubGlobal("ethereum", { request, on: vi.fn(), removeListener: vi.fn() });
  return request;
}

/** Lets the wallet read and the pool read land. */
export async function flushChain() {
  for (let i = 0; i < 4; i += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
}

/** Renders the app against a fake pool and a connected wallet, after the first reads land. */
export async function renderApp<T extends NovaChain | null = FakeNovaChain>(
  path: string,
  chain: T = new FakeNovaChain() as unknown as T,
  options: { wallet?: "authorized" | "fresh" | "none" } = {},
) {
  const wallet = options.wallet ?? "authorized";
  if (wallet !== "none") stubConnectedWallet(PLAYER, wallet === "authorized");
  const view = render(
    <MemoryRouter initialEntries={[path]}>
      <App chain={chain} />
    </MemoryRouter>,
  );
  await flushChain();
  return { ...view, chain };
}
