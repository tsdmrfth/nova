import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  assertArtLockVersion,
  canonManifest,
  resolvePack,
} from "@nova/assets";
import { useDayStore } from "../day/useDayStore";
import { usePrefersReducedMotion } from "../hud/usePrefersReducedMotion";
import { HomeSceneHost } from "../scene/HomeSceneHost";
import { ResultsHud } from "../results/ResultsHud";
import { buildResultsModel } from "../results/resultsModel";
import { settleOffline, snapshotFromSettle } from "../results/settleMock";

export function ResultsPage() {
  const { state, claim } = useDayStore();
  const navigate = useNavigate();
  const { pack, missing } = useMemo(
    () => resolvePack(canonManifest, state.day),
    [state.day],
  );
  const reducedMotion = usePrefersReducedMotion();
  const dpr = Math.min(
    typeof window === "undefined" ? 1 : window.devicePixelRatio || 1,
    2,
  );
  const settled = useMemo(() => settleOffline(state), [state]);
  const model = useMemo(
    () => buildResultsModel(state, settled),
    [state, settled],
  );

  useEffect(() => {
    assertArtLockVersion(canonManifest.artLockVersion);
    if (missing.length > 0) {
      console.error("[nova] missing canon ids in Results scene", missing);
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
      <ResultsHud
        model={model}
        onClaim={() => claim(snapshotFromSettle(settled))}
        onBack={() => navigate("/")}
        onVote={() => navigate("/vote")}
      />
    </section>
  );
}
