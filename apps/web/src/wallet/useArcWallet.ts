import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { connectAccount, ensureArcNetwork, readChainId, readInjectedProvider, walletErrorMessage } from "../demo/arcWallet";
import { readDemoConfig } from "../demo/demoConfig";

/** Set by Disconnect so a reload doesn't silently pick the wallet's account back up. */
export const WALLET_DISCONNECTED_KEY = "nova.wallet.disconnected";

function readDisconnected(): boolean {
  try {
    return localStorage.getItem(WALLET_DISCONNECTED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDisconnected(value: boolean) {
  try {
    if (value) localStorage.setItem(WALLET_DISCONNECTED_KEY, "1");
    else localStorage.removeItem(WALLET_DISCONNECTED_KEY);
  } catch {
    // Blocked storage only costs the reload guard.
  }
}

export function useArcWallet(enabled: boolean) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // False until the first silent account read lands, so a reload doesn't bounce to Connect.
  const [checked, setChecked] = useState(() => !enabled || !readInjectedProvider());
  const active = useRef(!readDisconnected());
  const generation = useRef(0);
  const pending = useRef(false);
  // Bumped by Disconnect so an in-flight connect can't clear the reload guard.
  const session = useRef(0);
  const config = useMemo(() => readDemoConfig(), []);

  useEffect(() => {
    if (!enabled) return;
    const provider = readInjectedProvider();
    if (!provider) return;
    let mounted = true;
    const refresh = async () => {
      const version = ++generation.current;
      try {
        const [accounts, chain] = await Promise.all([
          provider.request({ method: "eth_accounts" }), readChainId(provider),
        ]);
        if (!mounted || version !== generation.current) return;
        if (!active.current) {
          setChecked(true);
          return;
        }
        setAccount(Array.isArray(accounts) && typeof accounts[0] === "string" && /^0x[a-fA-F0-9]{40}$/.test(accounts[0]) ? accounts[0] : null);
        setChainId(chain);
        setChecked(true);
      } catch {
        if (mounted && version === generation.current) {
          setAccount(null);
          setChainId(null);
          setChecked(true);
        }
      }
    };
    const changed = () => { void refresh(); };
    const disconnected = () => {
      ++generation.current;
      setAccount(null);
      setChainId(null);
    };
    void refresh();
    provider.on?.("accountsChanged", changed);
    provider.on?.("chainChanged", changed);
    provider.on?.("disconnect", disconnected);
    return () => {
      mounted = false;
      provider.removeListener?.("accountsChanged", changed);
      provider.removeListener?.("chainChanged", changed);
      provider.removeListener?.("disconnect", disconnected);
    };
  }, [enabled]);

  const connect = useCallback(async () => {
    if (pending.current) return false;
    const provider = readInjectedProvider();
    if (!provider) {
      setError("Install MetaMask or Rabby, then open Nova in that browser.");
      return false;
    }
    const sessionId = session.current;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      await connectAccount(provider);
      await ensureArcNetwork(provider, config);
      const [accounts, chain] = await Promise.all([
        provider.request({ method: "eth_accounts" }), readChainId(provider),
      ]);
      if (sessionId !== session.current) return false;
      const address = Array.isArray(accounts) && typeof accounts[0] === "string" && /^0x[a-fA-F0-9]{40}$/.test(accounts[0]) ? accounts[0] : null;
      if (!address) throw new Error("Wallet did not return an account.");
      active.current = true;
      writeDisconnected(false);
      setAccount(address);
      setChainId(chain);
      if (chain !== config.chainId) throw new Error(`Switch your wallet to ${config.chainName}.`);
      return true;
    } catch (caught) {
      setError(walletErrorMessage(caught, "The wallet request was rejected. Try again."));
      return false;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }, [config]);

  const disconnect = useCallback(() => {
    session.current += 1;
    active.current = false;
    writeDisconnected(true);
    ++generation.current;
    setAccount(null);
    setChainId(null);
    setError(null);
    // MetaMask also drops the site's permission; wallets without EIP-2255 revoke just ignore it.
    readInjectedProvider()
      ?.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] })
      .catch(() => undefined);
  }, []);

  return { account, chainId, busy, error, checked, connect, disconnect, onArc: chainId === config.chainId, chainName: config.chainName };
}
