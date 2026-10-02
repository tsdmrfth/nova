import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useArcWallet } from "./useArcWallet";
import type { Eip1193Provider } from "../demo/arcWallet";

const ADDRESS = "0xF2FDeE747478A34deaf79811A4f87581dc01bBBD";

function wallet() {
  let accounts: string[] = [];
  let chain = "0x1";
  const listeners = new Map<string, (...args: unknown[]) => void>();
  const request = vi.fn(async ({ method }: { method: string }) => {
    if (method === "eth_requestAccounts") { accounts = [ADDRESS]; return accounts; }
    if (method === "eth_accounts") return accounts;
    if (method === "eth_chainId") return chain;
    if (method === "wallet_switchEthereumChain") { chain = "0x4cef52"; return null; }
    return null;
  });
  const provider: Eip1193Provider = {
    request,
    on: (name, callback) => { listeners.set(name, callback); },
    removeListener: (name) => { listeners.delete(name); },
  };
  vi.stubGlobal("ethereum", provider);
  return { request, listeners, setAccounts: (next: string[]) => { accounts = next; listeners.get("accountsChanged")?.(next); }, setChain: (next: string) => { chain = next; listeners.get("chainChanged")?.(next); } };
}

beforeEach(() => { vi.stubEnv("VITE_ARC_NETWORK", "testnet"); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("real browser wallet", () => {
  it("requests permission and switches to Arc testnet without sending a transaction", async () => {
    const mock = wallet();
    const { result } = renderHook(() => useArcWallet(true));
    await act(async () => { expect(await result.current.connect()).toBe(true); });
    expect(result.current.account).toBe(ADDRESS);
    expect(result.current.onArc).toBe(true);
    expect(mock.request).toHaveBeenCalledWith({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x4cef52" }] });
    expect(mock.request.mock.calls.some(([args]) => args.method === "eth_sendTransaction")).toBe(false);
  });

  it("follows account and network changes and cleans up listeners", async () => {
    const mock = wallet();
    const { result, unmount } = renderHook(() => useArcWallet(true));
    await act(async () => { await result.current.connect(); });
    act(() => { mock.setChain("0x1"); });
    await waitFor(() => expect(result.current.onArc).toBe(false));
    act(() => { mock.setAccounts([]); });
    await waitFor(() => expect(result.current.account).toBeNull());
    unmount();
    expect(mock.listeners.size).toBe(0);
  });

  it("clears the app session and does not reconnect on subsequent wallet events", async () => {
    const mock = wallet();
    const { result } = renderHook(() => useArcWallet(true));
    await act(async () => { await result.current.connect(); });
    act(() => result.current.disconnect());
    await act(async () => { mock.setAccounts([ADDRESS]); });
    expect(result.current.account).toBeNull();
  });

  it("shows a missing-wallet error without pretending to connect", async () => {
    vi.stubGlobal("ethereum", undefined);
    const { result } = renderHook(() => useArcWallet(true));
    await act(async () => { expect(await result.current.connect()).toBe(false); });
    expect(result.current.account).toBeNull();
    expect(result.current.error).toMatch(/Install MetaMask or Rabby/);
  });

  it("handles rejected permission requests", async () => {
    const mock = wallet();
    mock.request.mockImplementation(async ({ method }) => {
      if (method === "eth_requestAccounts") throw { code: 4001 };
      return method === "eth_accounts" ? [] : "0x1";
    });
    const { result } = renderHook(() => useArcWallet(true));
    await act(async () => { expect(await result.current.connect()).toBe(false); });
    expect(result.current.account).toBeNull();
    expect(result.current.error).toMatch(/rejected/);
    expect(result.current.busy).toBe(false);
  });

  it("adds an unknown network and explicitly switches after adding it", async () => {
    const mock = wallet();
    const original = mock.request.getMockImplementation()!;
    let switches = 0;
    mock.request.mockImplementation(async (args) => {
      if (args.method === "wallet_switchEthereumChain" && ++switches === 1) throw { code: 4902 };
      return original(args);
    });
    const { result } = renderHook(() => useArcWallet(true));
    await act(async () => { expect(await result.current.connect()).toBe(true); });
    expect(switches).toBe(2);
    expect(mock.request).toHaveBeenCalledWith(expect.objectContaining({ method: "wallet_addEthereumChain" }));
  });
});
