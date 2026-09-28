import {
  PLATFORM_FEE_LABEL,
  buySplitPercents,
  formatUsdc,
  quotePack,
  type MicroUsdc,
} from "@nova/shared";
import { formatCheckoutUsdc } from "../buy/buyModel";
import type { DemoConfig } from "./demoConfig";
import { contractsDeployed } from "./demoConfig";
import { GRANT_DEMO_COPY } from "./demoCopy";

export type DemoSplitRow = {
  label: string;
  pct: string;
  spark: string;
  pulse: string;
};

export type GrantDemoModel = {
  kicker: string;
  title: string;
  honesty: string;
  notLive: string | null;
  testnetNote: string;
  chainHint: string;
  splitTitle: string;
  rows: DemoSplitRow[];
  deployed: boolean;
  connect: string;
  switchNetwork: string;
  buySpark: string;
  buyPulse: string;
  pendingDeploy: string;
  signalTitle: string;
  signalBody: string;
};

export function buildGrantDemoModel(config: DemoConfig): GrantDemoModel {
  const percents = buySplitPercents();
  const spark = quotePack("spark");
  const pulse = quotePack("pulse");
  const money = (micro: MicroUsdc) => `${formatCheckoutUsdc(micro)} USDC`;
  const deployed = contractsDeployed(config);

  return {
    kicker: GRANT_DEMO_COPY.kicker,
    title: GRANT_DEMO_COPY.title,
    honesty: GRANT_DEMO_COPY.honesty,
    notLive: deployed ? null : GRANT_DEMO_COPY.notLive,
    testnetNote: GRANT_DEMO_COPY.testnetNote,
    chainHint: GRANT_DEMO_COPY.chainHint,
    splitTitle: GRANT_DEMO_COPY.splitTitle,
    rows: [
      {
        label: "Prize pool",
        pct: `${percents.prizePool}%`,
        spark: money(spark.prizePool),
        pulse: money(pulse.prizePool),
      },
      {
        label: PLATFORM_FEE_LABEL,
        pct: `${percents.studioNet}%`,
        spark: money(spark.studioNet),
        pulse: money(pulse.studioNet),
      },
      {
        label: "Nova operating budget",
        pct: `${percents.novaBudget}%`,
        spark: money(spark.novaBudget),
        pulse: money(pulse.novaBudget),
      },
    ],
    deployed,
    connect: GRANT_DEMO_COPY.connect,
    switchNetwork: GRANT_DEMO_COPY.switchNetwork,
    buySpark: GRANT_DEMO_COPY.buySpark,
    buyPulse: GRANT_DEMO_COPY.buyPulse,
    pendingDeploy: GRANT_DEMO_COPY.pendingDeploy,
    signalTitle: GRANT_DEMO_COPY.signalTitle,
    signalBody: GRANT_DEMO_COPY.signalBody,
  };
}

export function formatLedgerUsdc(micro: bigint): string {
  return `${formatUsdc(micro)} USDC`;
}
