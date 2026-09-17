import { useEffect, useMemo, useState } from "react";
import {
  assertArtLockVersion,
  canonManifest,
  resolvePack,
  tileArtId,
  type ChoiceId,
} from "@nova/assets";
import { HomeHud } from "../hud/HomeHud";
import { HOME_HUD_MODEL } from "../hud/homeHudModel";
import { usePrefersReducedMotion } from "../hud/usePrefersReducedMotion";
import { HomeSceneHost } from "../scene/HomeSceneHost";

export function HomePage() {
  const { pack, missing } = useMemo(
    () => resolvePack(canonManifest, HOME_HUD_MODEL.day),
    [],
  );
  const [selected, setSelected] = useState<ChoiceId | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const dpr = Math.min(
    typeof window === "undefined" ? 1 : window.devicePixelRatio || 1,
    2,
  );
  const model = useMemo(
    () => ({
      ...HOME_HUD_MODEL,
      day: pack.day,
      choices: HOME_HUD_MODEL.choices.map((choice) => ({
        ...choice,
        artId: tileArtId(pack, choice.id),
      })),
    }),
    [pack],
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
        selected={selected}
        phase="idle"
        reducedMotion={reducedMotion}
        dpr={dpr}
      />
      <HomeHud
        model={model}
        selected={selected}
        onSelect={setSelected}
        onCast={() => undefined}
        onUsdcChip={() => undefined}
      />
    </section>
  );
}
