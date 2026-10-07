import { useMemo, useState } from "react";
import type { PackId } from "@nova/shared";
import { BuyHud } from "../buy/BuyHud";
import { BUY_COPY, DEFAULT_PACK_ID, buildBuyModel, buyStatus } from "../buy/buyModel";
import { useDayStore } from "../day/useDayStore";
import { readDemoConfig } from "../demo/demoConfig";
import { ScreenFrame } from "../ui";
import { useBack } from "./useBack";

export function BuyPage() {
  const { state, buy, busy, error, available, ready } = useDayStore();
  const back = useBack(state.status === "cast" ? "/confirmation" : "/vote");
  const [selectedPackId, setSelectedPackId] = useState<PackId>(DEFAULT_PACK_ID);
  // Only a purchase started here gets the "didn't go through" heading.
  const [failed, setFailed] = useState(false);
  const config = useMemo(() => readDemoConfig(), []);
  const unavailable = !available
    ? `Purchases on ${config.chainName} are not available yet. The purchase contract has not been configured.`
    : ready && state.status === "cast"
      ? BUY_COPY.closedAfterVote
      : ready && !state.votingOpen
        ? "Today's round is closed. Extra opens again with the next day."
        : null;
  const model = useMemo(() => {
    const base = buildBuyModel(state, selectedPackId);
    return {
      ...base,
      cta: busy ? BUY_COPY.pendingCta : base.cta,
      ctaPending: busy,
      ctaEnabled: ready && !busy && !unavailable && base.ctaEnabled,
      ctaDisabledReason: unavailable ?? base.ctaDisabledReason,
      status: buyStatus({
        busy,
        failed,
        error,
        youPay: base.breakdown.youPay,
        confirmed: base.status,
      }),
    };
  }, [state, selectedPackId, busy, error, failed, unavailable, ready]);

  const onBuy = async () => {
    setFailed(false);
    setFailed(!(await buy(selectedPackId)));
  };

  return (
    <ScreenFrame className="home-screen home-screen--buy" testId="buy-screen">
      <BuyHud
        model={model}
        selectedPackId={selectedPackId}
        onSelectPack={setSelectedPackId}
        onBuy={() => void onBuy()}
        onBack={back}
      />
    </ScreenFrame>
  );
}
