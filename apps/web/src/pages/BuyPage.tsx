import { useMemo, useState } from "react";
import type { PackId } from "@nova/shared";
import { BuyHud } from "../buy/BuyHud";
import { DEFAULT_PACK_ID, buildBuyModel } from "../buy/buyModel";
import { useDayStore } from "../day/useDayStore";
import { readDemoConfig } from "../demo/demoConfig";
import { ScreenFrame } from "../ui";
import { useBack } from "./useBack";

export function BuyPage() {
  const { state, buy, busy, error, transactionUrl, offline } = useDayStore();
  const back = useBack(state.status === "cast" ? "/confirmation" : "/vote");
  const [selectedPackId, setSelectedPackId] = useState<PackId>(DEFAULT_PACK_ID);
  const config = useMemo(() => readDemoConfig(), []);
  const unavailable = !offline && !config.poolAddress
    ? `Purchases on ${config.chainName} are not available yet. The purchase contract has not been configured.`
    : null;
  const model = useMemo(() => {
    const base = buildBuyModel(state, selectedPackId);
    return {
      ...base,
      ctaEnabled: !busy && !unavailable && base.ctaEnabled,
      ctaDisabledReason: unavailable ?? base.ctaDisabledReason,
      status: error ?? (busy ? "Confirm in your wallet and wait for confirmation…" : base.status),
    };
  }, [state, selectedPackId, busy, error, unavailable]);

  return (
    <ScreenFrame className="home-screen home-screen--buy" testId="buy-screen">
      {transactionUrl ? <a href={transactionUrl} target="_blank" rel="noreferrer">View confirmed purchase</a> : null}
      <BuyHud
        model={model}
        selectedPackId={selectedPackId}
        onSelectPack={setSelectedPackId}
        onBuy={() => buy(selectedPackId)}
        onBack={back}
      />
    </ScreenFrame>
  );
}
