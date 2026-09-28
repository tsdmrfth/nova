import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  assertArtLockVersion,
  canonManifest,
  resolvePack,
} from "@nova/assets";
import { ConfirmationHud } from "../confirmation/ConfirmationHud";
import { buildConfirmationModel } from "../confirmation/confirmationModel";
import { useDayStore } from "../day/useDayStore";
import { usePrefersReducedMotion } from "../hud/usePrefersReducedMotion";
import { HomeSceneHost } from "../scene/HomeSceneHost";

export function ConfirmationPage() {
  const { state } = useDayStore();
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
  const model = useMemo(() => buildConfirmationModel(state), [state]);

  useEffect(() => {
    assertArtLockVersion(canonManifest.artLockVersion);
    if (missing.length > 0) {
      console.error("[nova] missing canon ids in Confirmation scene", missing);
    }
  }, [missing]);

  return (
    <section className="home-screen home-screen--confirm">
      <HomeSceneHost
        pack={pack}
        selected={state.selected}
        phase={state.status === "cast" ? "pending" : "idle"}
        reducedMotion={reducedMotion}
        dpr={dpr}
      />
      <ConfirmationHud
        model={model}
        onResults={() => navigate("/results")}
        onVote={() => navigate("/vote")}
        onBuy={() => navigate("/buy")}
      />
    </section>
  );
}
