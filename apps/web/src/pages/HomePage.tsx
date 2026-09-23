import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  assertArtLockVersion,
  canonManifest,
  resolvePack,
  tileArtId,
} from "@nova/assets";
import { useDayStore } from "../day/useDayStore";
import { HomeHud } from "../hud/HomeHud";
import { buildHudModel } from "../hud/homeHudModel";
import { usePrefersReducedMotion } from "../hud/usePrefersReducedMotion";
import { GrantToast } from "../onboarding/GrantToast";
import { TutorialOverlay } from "../onboarding/TutorialOverlay";
import { useOnboarding } from "../onboarding/useOnboarding";
import { HomeSceneHost } from "../scene/HomeSceneHost";

export function CastPage() {
  const { state, select, setSpend, cast } = useDayStore();
  const onboarding = useOnboarding();
  const navigate = useNavigate();
  const goBuy = () => navigate("/buy");
  const { pack, missing } = useMemo(
    () => resolvePack(canonManifest, state.day),
    [state.day],
  );
  const reducedMotion = usePrefersReducedMotion();
  const dpr = Math.min(
    typeof window === "undefined" ? 1 : window.devicePixelRatio || 1,
    2,
  );
  const artByChoice = useMemo(
    () => ({
      A: tileArtId(pack, "A"),
      B: tileArtId(pack, "B"),
      C: tileArtId(pack, "C"),
    }),
    [pack],
  );
  const model = useMemo(
    () => buildHudModel(state, artByChoice),
    [state, artByChoice],
  );

  useEffect(() => {
    assertArtLockVersion(canonManifest.artLockVersion);
    if (missing.length > 0) {
      console.error("[nova] missing canon ids in Home pack", missing);
    }
  }, [missing]);

  return (
    <section className="home-screen">
      <HomeSceneHost
        pack={pack}
        selected={state.selected}
        phase={state.status === "cast" ? "pending" : "choosing"}
        reducedMotion={reducedMotion}
        dpr={dpr}
      />
      <HomeHud
        model={model}
        selected={state.selected}
        onSelect={select}
        onSpend={setSpend}
        onCast={cast}
        onUsdcChip={goBuy}
        onBuyExtraPlus={goBuy}
      />
      {onboarding.state.grantPending ? (
        <GrantToast
          firstDay
          reducedMotion={reducedMotion}
          onDismiss={onboarding.dismissGrant}
        />
      ) : null}
      {!onboarding.state.grantPending &&
      onboarding.onboarded &&
      !onboarding.state.tutorialSeen ? (
        <TutorialOverlay
          onGotIt={onboarding.completeTutorial}
          onSkip={onboarding.completeTutorial}
        />
      ) : null}
    </section>
  );
}

export function HomePage() {
  return <CastPage />;
}

export function VotePage() {
  return <CastPage />;
}
