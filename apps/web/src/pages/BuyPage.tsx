import { useMemo, useState } from "react";
import type { PackId } from "@nova/shared";
import { BuyHud } from "../buy/BuyHud";
import { DEFAULT_PACK_ID, buildBuyModel } from "../buy/buyModel";
import { useDayStore } from "../day/useDayStore";
import { ScreenFrame } from "../ui";
import { useBack } from "./useBack";

export function BuyPage() {
  const { state, buy } = useDayStore();
  const back = useBack(state.status === "cast" ? "/confirmation" : "/vote");
  const [selectedPackId, setSelectedPackId] = useState<PackId>(DEFAULT_PACK_ID);
  const model = useMemo(
    () => buildBuyModel(state, selectedPackId),
    [state, selectedPackId],
  );

  return (
    <ScreenFrame className="home-screen home-screen--buy" testId="buy-screen">
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
