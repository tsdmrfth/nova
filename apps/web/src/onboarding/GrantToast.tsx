import { useEffect } from "react";
import { GRANT_TOAST_MS, ONBOARDING_COPY } from "./onboardingCopy";
import "./onboarding.css";

type GrantToastProps = {
  firstDay?: boolean;
  reducedMotion: boolean;
  onDismiss(): void;
};

export function GrantToast({
  firstDay = false,
  reducedMotion,
  onDismiss,
}: GrantToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, GRANT_TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [onDismiss]);

  return (
    <button
      type="button"
      className={
        reducedMotion ? "oboard-toast" : "oboard-toast oboard-toast--motion"
      }
      data-testid="grant-toast"
      onClick={onDismiss}
    >
      <p className="oboard-toast-title">{ONBOARDING_COPY.grantTitle}</p>
      <p className="oboard-toast-body">
        {firstDay ? ONBOARDING_COPY.grantFirstDay : ONBOARDING_COPY.grantBody}
      </p>
    </button>
  );
}
