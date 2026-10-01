/** Honest framing for the public Microgrant page. No yield, odds, or partnership claim. */
export const GRANT_DEMO_COPY = {
  kicker: "Nova · /demo",
  title: "One Extra Influence buy",
  honesty:
    "Nova is a story you can nudge with programmable USDC on Arc. This page is one real buy, then — after the day settles — one real agent transaction: a public USDC signal from the 2% Nova operating budget to Nova's public wallet. It is not a general intelligence, and it is not affiliated with Circle.",
  notLive:
    "Contract addresses and the live host are filled in by a human deployer. Until those placeholders are set, this page cannot broadcast a mainnet transaction.",
  testnetNote:
    "A testnet-only deploy does not satisfy the Microgrant. This route targets Arc mainnet, chain id 5042.",
  splitTitle: "Where this USDC goes",
  connect: "Connect wallet",
  switchNetwork: "Switch to Arc mainnet",
  buySpark: "Buy Spark · 1 USDC",
  buyPulse: "Buy Pulse · 5 USDC",
  pendingDeploy: "Mainnet deploy pending",
  buyStep: "Buy 1 Extra Influence pack",
  explorerStep: "Explorer links",
  buyTx: "Buy tx",
  signalTx: "NovaSignal tx",
  openNova: "Open Nova",
  approveTx: "Approval transaction",
  signalTitle: "Nova signal",
  signalBody:
    "After settle, an allowlisted agent sends USDC from the operating budget only. The prize pool is not spent and there is no prize top-up.",
  signalPending: "Signal transaction pending a mainnet broadcast.",
  signalRecorded: "A signal is recorded on this contract.",
  dayOpen: "This day is still open. The signal waits until settle.",
  daySettled: "This day is settled. Spendable budget is the settled operating budget minus signals already sent.",
  explorer: "View on explorer",
  walletLabel: "Nova public wallet",
  chainHint: "Arc mainnet · chain id 5042",
  rejected: "The wallet request was rejected.",
  wrongChain: "Switch to Arc mainnet (chain id 5042) before buying.",
  connected: "Connected",
  ledger: "On-chain ledger",
} as const;
