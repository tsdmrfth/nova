import { useMemo, useState } from "react";
import { quotePack } from "@nova/shared";
import {
  connectAccount,
  ensureArcMainnet,
  readChainId,
  readInjectedProvider,
  readPoolSnapshot,
  readSignalSnapshot,
  sendExtraInfluenceBuy,
  walletErrorMessage,
  type Eip1193Provider,
} from "./arcWallet";
import type { PoolSnapshot, SignalSnapshot } from "./demoAbi";
import {
  explorerAddressUrl,
  explorerTxUrl,
  readDemoConfig,
  type DemoConfig,
} from "./demoConfig";
import { GRANT_DEMO_COPY } from "./demoCopy";
import { buildGrantDemoModel, formatLedgerUsdc } from "./demoModel";
import "./GrantDemo.css";

type GrantDemoPageProps = {
  config?: DemoConfig;
  provider?: Eip1193Provider | null;
};

export function GrantDemoPage({
  config = readDemoConfig(),
  provider,
}: GrantDemoPageProps) {
  const model = useMemo(() => buildGrantDemoModel(config), [config]);
  const spark = quotePack("spark");
  const pulse = quotePack("pulse");
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approveHash, setApproveHash] = useState<string | null>(null);
  const [buyHash, setBuyHash] = useState<string | null>(config.sampleBuyTx);
  const [poolSnap, setPoolSnap] = useState<PoolSnapshot | null>(null);
  const [signalSnap, setSignalSnap] = useState<SignalSnapshot | null>(null);

  const resolvedProvider = provider === undefined ? readInjectedProvider() : provider;
  const onArc = chainId === config.chainId;
  const canBuy = Boolean(model.deployed && account && onArc && !busy);

  async function refresh(nextProvider: Eip1193Provider) {
    if (config.poolAddress) {
      setPoolSnap(await readPoolSnapshot(nextProvider, config.poolAddress));
    }
    if (config.signalAddress) {
      setSignalSnap(await readSignalSnapshot(nextProvider, config.signalAddress));
    }
  }

  async function onConnect() {
    if (!resolvedProvider) {
      setError("No injected wallet. Install a wallet that speaks Ethereum JSON-RPC, then retry.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const nextAccount = await connectAccount(resolvedProvider);
      await ensureArcMainnet(resolvedProvider, config);
      const nextChain = await readChainId(resolvedProvider);
      setAccount(nextAccount);
      setChainId(nextChain);
      if (nextChain === config.chainId) await refresh(resolvedProvider);
    } catch (caught) {
      setError(walletErrorMessage(caught, GRANT_DEMO_COPY.rejected));
    } finally {
      setBusy(false);
    }
  }

  async function onBuy(pack: "spark" | "pulse") {
    if (!resolvedProvider || !account || !canBuy) return;
    setBusy(true);
    setError(null);
    try {
      const receipt = await sendExtraInfluenceBuy({
        provider: resolvedProvider,
        from: account,
        config,
        pack,
        price: pack === "spark" ? spark.youPay : pulse.youPay,
      });
      setApproveHash(receipt.approveHash);
      setBuyHash(receipt.buyHash);
      await refresh(resolvedProvider);
    } catch (caught) {
      setError(walletErrorMessage(caught, GRANT_DEMO_COPY.rejected));
    } finally {
      setBusy(false);
    }
  }

  const signalWallet = signalSnap?.wallet;
  const signalTx = config.sampleSignalTx;

  return (
    <section className="grant-demo" data-testid="grant-demo">
      <header>
        <p className="grant-kicker">{model.kicker}</p>
        <h1>{model.title}</h1>
      </header>

      <article className="grant-card">
        <p className="grant-honesty" data-testid="grant-honesty">
          {model.honesty}
        </p>
        <p className="grant-note">{model.testnetNote}</p>
        <p className="grant-note">{model.chainHint}</p>
        {model.notLive ? (
          <p data-testid="grant-pending-deploy">{model.notLive}</p>
        ) : null}
      </article>

      <article className="grant-card" data-testid="grant-split">
        <h2>{model.splitTitle}</h2>
        <dl className="grant-split">
          <div>
            <dt>Pack</dt>
            <dd>Spark</dd>
            <dd>Pulse</dd>
          </div>
          {model.rows.map((row) => (
            <div key={row.label}>
              <dt>
                {row.label} <span>{row.pct}</span>
              </dt>
              <dd>{row.spark}</dd>
              <dd>{row.pulse}</dd>
            </div>
          ))}
        </dl>
      </article>

      <article className="grant-card">
        <div className="grant-actions">
          <button type="button" data-testid="grant-connect" disabled={busy} onClick={onConnect}>
            {account ? GRANT_DEMO_COPY.connected : model.connect}
          </button>
          {account && !onArc ? (
            <button type="button" data-testid="grant-switch" disabled={busy} onClick={onConnect}>
              {model.switchNetwork}
            </button>
          ) : null}
          <button
            type="button"
            data-testid="grant-buy-spark"
            disabled={!canBuy}
            onClick={() => onBuy("spark")}
          >
            {model.deployed ? model.buySpark : model.pendingDeploy}
          </button>
          <button
            type="button"
            data-testid="grant-buy-pulse"
            disabled={!canBuy}
            onClick={() => onBuy("pulse")}
          >
            {model.buyPulse}
          </button>
        </div>
        {account ? (
          <p className="grant-note" data-testid="grant-account">
            {account}
            {chainId !== null ? ` · chain ${chainId}` : ""}
          </p>
        ) : null}
        {account && !onArc ? <p data-testid="grant-wrong-chain">{GRANT_DEMO_COPY.wrongChain}</p> : null}
        {error ? (
          <p className="grant-error" data-testid="grant-error">
            {error}
          </p>
        ) : null}
        <div className="grant-links">
          {approveHash ? (
            <a href={explorerTxUrl(config.explorerUrl, approveHash)}>
              {GRANT_DEMO_COPY.approveTx}
            </a>
          ) : null}
          {buyHash ? (
            <a data-testid="grant-buy-tx" href={explorerTxUrl(config.explorerUrl, buyHash)}>
              {GRANT_DEMO_COPY.explorer}
            </a>
          ) : null}
        </div>
      </article>

      <article className="grant-card" data-testid="grant-signal">
        <h2>{model.signalTitle}</h2>
        <p>{model.signalBody}</p>
        {poolSnap ? (
          <p data-testid="grant-ledger">
            {GRANT_DEMO_COPY.ledger}: prize {formatLedgerUsdc(poolSnap.prize)} · studio net{" "}
            {formatLedgerUsdc(poolSnap.studioNet)} · budget {formatLedgerUsdc(poolSnap.novaBudget)}
          </p>
        ) : null}
        {poolSnap ? (
          <p>{poolSnap.settled ? GRANT_DEMO_COPY.daySettled : GRANT_DEMO_COPY.dayOpen}</p>
        ) : null}
        {signalSnap && signalSnap.signaled > 0n ? (
          <p data-testid="grant-signal-recorded">
            {GRANT_DEMO_COPY.signalRecorded} {formatLedgerUsdc(signalSnap.signaled)} sent
            {signalWallet ? ` to ${signalWallet}` : ""}.
          </p>
        ) : (
          <p>{GRANT_DEMO_COPY.signalPending}</p>
        )}
        <div className="grant-links">
          {signalTx ? (
            <a data-testid="grant-signal-tx" href={explorerTxUrl(config.explorerUrl, signalTx)}>
              {GRANT_DEMO_COPY.explorer}
            </a>
          ) : null}
          {signalWallet && signalWallet !== "0x0000000000000000000000000000000000000000" ? (
            <a href={explorerAddressUrl(config.explorerUrl, signalWallet)}>
              {GRANT_DEMO_COPY.walletLabel}
            </a>
          ) : null}
        </div>
      </article>
    </section>
  );
}
