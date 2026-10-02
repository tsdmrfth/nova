import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { connectAccount, ensureArcNetwork, readChainId, readInjectedProvider, walletErrorMessage } from "../demo/arcWallet";
import { readDemoConfig } from "../demo/demoConfig";

export function useArcWallet(enabled: boolean) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = useRef(true);
  const generation = useRef(0);
  const pending = useRef(false);
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
        if (!mounted || !active.current || version !== generation.current) return;
        setAccount(Array.isArray(accounts) && typeof accounts[0] === "string" && /^0x[a-fA-F0-9]{40}$/.test(accounts[0]) ? accounts[0] : null);
        setChainId(chain);
      } catch {
        if (mounted && version === generation.current) {
          setAccount(null);
          setChainId(null);
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
    active.current = true;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      await connectAccount(provider);
      await ensureArcNetwork(provider, config);
      const [accounts, chain] = await Promise.all([
        provider.request({ method: "eth_accounts" }), readChainId(provider),
      ]);
      if (!active.current) return false;
      const address = Array.isArray(accounts) && typeof accounts[0] === "string" && /^0x[a-fA-F0-9]{40}$/.test(accounts[0]) ? accounts[0] : null;
      if (!address) throw new Error("Wallet did not return an account.");
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
    active.current = false;
    ++generation.current;
    setAccount(null);
    setChainId(null);
    setError(null);
  }, []);

  return { account, chainId, busy, error, connect, disconnect, onArc: chainId === config.chainId, chainName: config.chainName };
}
