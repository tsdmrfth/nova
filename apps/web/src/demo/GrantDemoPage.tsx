import { useMemo, useState, type ReactNode } from "react";
import { PLATFORM_FEE_LABEL, quotePack } from "@nova/shared";
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
import {
  Button,
  CheckIcon,
  ExternalIcon,
  InfoLine,
  Kicker,
  Receipt,
  ReceiptRow,
  ScreenFrame,
  StoryTitle,
} from "../ui";
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

  const connectDone = Boolean(account && onArc);
  const buyDone = Boolean(buyHash);
  const stepState = (done: boolean, unlocked: boolean) =>
    done ? "done" : unlocked ? "active" : "locked";

  return (
    <ScreenFrame dim scroll className="grant-screen" testId="grant-demo">
      <header className="nv-stack grant-head nv-text-plate">
        <Kicker>{model.kicker}</Kicker>
        <StoryTitle size="sm">{model.title}</StoryTitle>
      </header>

      <StepCard n={1} title={model.connect} sub={model.chainHint} state={stepState(connectDone, true)}>
        <Button
          variant="secondary"
          compact
          testId="grant-connect"
          disabled={busy || connectDone}
          onClick={onConnect}
        >
          {account ? GRANT_DEMO_COPY.connected : model.connect}
        </Button>
        {account && !onArc ? (
          <Button variant="secondary" compact testId="grant-switch" disabled={busy} onClick={onConnect}>
            {model.switchNetwork}
          </Button>
        ) : null}
        {account ? (
          <p className="grant-mono" data-testid="grant-account">
            {account}
            {chainId !== null ? ` · chain ${chainId}` : ""}
          </p>
        ) : null}
        {account && !onArc ? (
          <p className="nv-note" data-testid="grant-wrong-chain">
            {GRANT_DEMO_COPY.wrongChain}
          </p>
        ) : null}
      </StepCard>

      <StepCard
        n={2}
        title={GRANT_DEMO_COPY.buyStep}
        sub={model.rows.map((row) => `${row.pct} ${row.label}`).join(" · ")}
        state={stepState(buyDone, connectDone)}
      >
        <div className="nv-grid-2">
          <Button
            variant="secondary"
            compact
            testId="grant-buy-spark"
            disabled={!canBuy}
            onClick={() => onBuy("spark")}
          >
            {model.deployed ? model.buySpark : model.pendingDeploy}
          </Button>
          <Button
            variant="secondary"
            compact
            testId="grant-buy-pulse"
            disabled={!canBuy}
            onClick={() => onBuy("pulse")}
          >
            {model.buyPulse}
          </Button>
        </div>
        <Receipt testId="grant-split">
          <p className="nv-kicker nv-kicker--muted grant-split-title">{model.splitTitle}</p>
          <ReceiptRow label="Pack" value="Spark · Pulse" mutedLabel />
          {model.rows.map((row) => (
            <ReceiptRow
              key={row.label}
              label={`${row.label} · ${row.pct}`}
              value={`${row.spark} · ${row.pulse}`}
            />
          ))}
        </Receipt>
        {error ? (
          <p className="nv-note grant-error" data-testid="grant-error">
            {error}
          </p>
        ) : null}
      </StepCard>

      <StepCard
        n={3}
        title={GRANT_DEMO_COPY.explorerStep}
        state={stepState(Boolean(buyHash && signalTx), buyDone)}
        highlight
      >
        {approveHash ? (
          <ExplorerRow label={GRANT_DEMO_COPY.approveTx} hash={approveHash} href={explorerTxUrl(config.explorerUrl, approveHash)} />
        ) : null}
        {buyHash ? (
          <ExplorerRow
            label={GRANT_DEMO_COPY.buyTx}
            hash={buyHash}
            href={explorerTxUrl(config.explorerUrl, buyHash)}
            testId="grant-buy-tx"
          />
        ) : null}
        {signalTx ? (
          <ExplorerRow
            label={GRANT_DEMO_COPY.signalTx}
            hash={signalTx}
            href={explorerTxUrl(config.explorerUrl, signalTx)}
            testId="grant-signal-tx"
          />
        ) : null}
        {signalWallet && signalWallet !== "0x0000000000000000000000000000000000000000" ? (
          <ExplorerRow
            label={GRANT_DEMO_COPY.walletLabel}
            hash={signalWallet}
            href={explorerAddressUrl(config.explorerUrl, signalWallet)}
          />
        ) : null}
        <div className="nv-stack grant-signal" data-testid="grant-signal">
          <p className="grant-signal__title">{model.signalTitle}</p>
          <p className="nv-note grant-left">{model.signalBody}</p>
          {poolSnap ? (
            <p className="nv-note grant-left" data-testid="grant-ledger">
              {GRANT_DEMO_COPY.ledger}: prize {formatLedgerUsdc(poolSnap.prize)} · {PLATFORM_FEE_LABEL}{" "}
              {formatLedgerUsdc(poolSnap.studioNet)} · budget {formatLedgerUsdc(poolSnap.novaBudget)}
            </p>
          ) : null}
          {poolSnap ? (
            <p className="nv-note grant-left">
              {poolSnap.settled ? GRANT_DEMO_COPY.daySettled : GRANT_DEMO_COPY.dayOpen}
            </p>
          ) : null}
          {signalSnap && signalSnap.signaled > 0n ? (
            <p className="nv-note grant-left" data-testid="grant-signal-recorded">
              {GRANT_DEMO_COPY.signalRecorded} {formatLedgerUsdc(signalSnap.signaled)} sent
              {signalWallet ? ` to ${signalWallet}` : ""}.
            </p>
          ) : (
            <p className="nv-note grant-left">{GRANT_DEMO_COPY.signalPending}</p>
          )}
        </div>
      </StepCard>

      <InfoLine boxed testId="grant-honesty">
        {model.honesty}
      </InfoLine>
      <p className="nv-note grant-left">{model.testnetNote}</p>
      {model.notLive ? (
        <p className="nv-note grant-left" data-testid="grant-pending-deploy">
          {model.notLive}
        </p>
      ) : null}

      <div className="nv-bottom">
        <a className="nv-btn nv-btn--primary" href="/" data-testid="grant-open-nova">
          {GRANT_DEMO_COPY.openNova}
        </a>
      </div>
    </ScreenFrame>
  );
}

type StepState = "done" | "active" | "locked";

function StepCard({
  n,
  title,
  sub,
  state,
  highlight = false,
  children,
}: {
  n: number;
  title: string;
  sub?: string;
  state: StepState;
  highlight?: boolean;
  children?: ReactNode;
}) {
  return (
    <section
      className={`nv-card grant-step grant-step--${state}${highlight && state !== "locked" ? " nv-card--selected" : ""}`}
      data-step={state}
      aria-label={`Step ${n}: ${title}`}
    >
      <div className="grant-step__head">
        <span className="grant-step__badge" aria-hidden="true">
          {state === "done" ? <CheckIcon size={14} /> : n}
        </span>
        <span className="nv-card__copy">
          <span className="nv-card__title">{`${n} · ${title}`}</span>
          {sub ? <span className="nv-card__sub">{sub}</span> : null}
        </span>
      </div>
      {children}
    </section>
  );
}

function ExplorerRow({
  label,
  hash,
  href,
  testId,
}: {
  label: string;
  hash: string;
  href: string;
  testId?: string;
}) {
  return (
    <a className="grant-link" href={href} target="_blank" rel="noreferrer" data-testid={testId}>
      <span className="grant-link__label">{label}</span>
      <span className="grant-link__hash">{`${hash.slice(0, 6)}…${hash.slice(-4)}`}</span>
      <ExternalIcon size={14} className="nv-icon-accent" />
    </a>
  );
}
