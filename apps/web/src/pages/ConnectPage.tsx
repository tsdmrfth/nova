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
import { ConnectHud, GeoBlockHud } from "../onboarding/ConnectHud";

export function ConnectPage() {
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

  useEffect(() => {
    assertArtLockVersion(canonManifest.artLockVersion);
    if (missing.length > 0) {
      console.error("[nova] missing canon ids in Connect scene", missing);
    }
  }, [missing]);

  return (
    <section className="home-screen">
      <HomeSceneHost
        pack={pack}
        selected={state.selected}
        phase="idle"
        reducedMotion={reducedMotion}
        dpr={dpr}
      />
      <ConnectHud onEnter={() => navigate("/")} />
    </section>
  );
}

export function GeoBlockPage() {
  const { state } = useDayStore();
  const { pack } = useMemo(
    () => resolvePack(canonManifest, state.day),
    [state.day],
  );
  const reducedMotion = usePrefersReducedMotion();
  const dpr = Math.min(
    typeof window === "undefined" ? 1 : window.devicePixelRatio || 1,
    2,
  );

  return (
    <section className="home-screen">
      <HomeSceneHost
        pack={pack}
        selected={null}
        phase="idle"
        reducedMotion={reducedMotion}
        dpr={dpr}
      />
      <GeoBlockHud />
    </section>
  );
}
