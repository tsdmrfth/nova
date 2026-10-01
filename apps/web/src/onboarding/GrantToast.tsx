import { useEffect, useState } from "react";
import { GlassSheet } from "../ui";
import { GRANT_TOAST_MS, ONBOARDING_COPY } from "./onboardingCopy";

type GrantToastProps = {
  /** Day-store Free balance when the daily grant toast is shown. */
  freeInfluence: number;
  reducedMotion: boolean;
  onDismiss(): void;
};

/** Screen 03. Slides down 240ms, holds 2.4s, tap to dismiss early. */
export function GrantToast({ freeInfluence, reducedMotion, onDismiss }: GrantToastProps) {
  const [granted] = useState(freeInfluence);

  useEffect(() => {
    const timer = window.setTimeout(onDismiss, GRANT_TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [onDismiss]);

  return (
    <button
      type="button"
      className={reducedMotion ? "oboard-toast" : "oboard-toast oboard-toast--motion"}
      data-testid="grant-toast"
      onClick={onDismiss}
    >
      <GlassSheet variant="toast">
        <span className="nv-orb-sm">{`+${granted}`}</span>
        <span className="oboard-toast__copy">
          <span className="oboard-toast__title">{`Free Influence +${granted}`}</span>
          <span className="oboard-toast__body">{ONBOARDING_COPY.grantBody}</span>
        </span>
      </GlassSheet>
    </button>
  );
}
