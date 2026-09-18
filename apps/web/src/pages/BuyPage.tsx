import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  assertArtLockVersion,
  canonManifest,
  resolvePack,
} from "@nova/assets";
import type { PackId } from "@nova/shared";
import { BuyHud } from "../buy/BuyHud";
import { DEFAULT_PACK_ID, buildBuyModel } from "../buy/buyModel";
import { useDayStore } from "../day/useDayStore";
import { usePrefersReducedMotion } from "../hud/usePrefersReducedMotion";
import { HomeSceneHost } from "../scene/HomeSceneHost";

export function BuyPage() {
  const { state, buy } = useDayStore();
  const navigate = useNavigate();
  const [selectedPackId, setSelectedPackId] = useState<PackId>(DEFAULT_PACK_ID);
  const { pack, missing } = useMemo(
    () => resolvePack(canonManifest, state.day),
    [state.day],
  );
  const reducedMotion = usePrefersReducedMotion();
  const dpr = Math.min(
    typeof window === "undefined" ? 1 : window.devicePixelRatio || 1,
    2,
  );
  const model = useMemo(
    () => buildBuyModel(state, selectedPackId),
    [state, selectedPackId],
  );

  useEffect(() => {
    assertArtLockVersion(canonManifest.artLockVersion);
    if (missing.length > 0) {
      console.error("[nova] missing canon ids in Buy scene", missing);
    }
  }, [missing]);

  return (
    <section className="home-screen">
      <HomeSceneHost
        pack={pack}
        selected={state.selected}
        phase={state.status === "cast" ? "pending" : "idle"}
        reducedMotion={reducedMotion}
        dpr={dpr}
      />
      <BuyHud
        model={model}
        selectedPackId={selectedPackId}
        onSelectPack={setSelectedPackId}
        onBuy={() => buy(selectedPackId)}
        onBack={() => navigate("/vote")}
      />
    </section>
  );
}
