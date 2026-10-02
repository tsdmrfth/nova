import { useDayStore } from "../day/useDayStore";
import { GuideHud } from "../guide/GuideHud";
import { useCalmMotion } from "../hud/usePrefersReducedMotion";
import { ScreenFrame } from "../ui";
import { useBack } from "./useBack";

/** Menu › Help › How Nova works. A layer: rises over Home and drops back down. */
export function GuidePage() {
  const { state } = useDayStore();
  const calm = useCalmMotion();
  const back = useBack("/");
  return (
    <ScreenFrame scroll className="guide-screen" testId="guide-screen">
      <GuideHud goal={state.goal} calm={calm} onBack={back} />
    </ScreenFrame>
  );
}
