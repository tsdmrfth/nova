import { Button, Checkbox, GlassSheet, InfoIcon, StoryTitle, Tag } from "../ui";
import { canProceed } from "./onboardingModel";
import { ONBOARDING_COPY } from "./onboardingCopy";
import { useOnboarding } from "./useOnboarding";

type SoftLaunchNoticeProps =
  | { mode?: "gate"; onEnter(): void; onClose?: never }
  /** Reopened from Menu › Help: no checkbox, just Close. */
  | { mode: "read"; onClose(): void; onEnter?: never };

/** Screen 02. Enter Nova stays disabled until the box is checked. */
export function SoftLaunchNotice(props: SoftLaunchNoticeProps) {
  const { state, setRulesChecked } = useOnboarding();
  const gate = props.mode !== "read";

  return (
    <GlassSheet
      variant="modal"
      testId="soft-launch-notice"
      role="dialog"
      ariaModal
      labelledBy="soft-launch-title"
    >
      <Tag>{ONBOARDING_COPY.noticeTag.toUpperCase()}</Tag>
      <StoryTitle size="md" id="soft-launch-title">
        {ONBOARDING_COPY.noticeTitle}
      </StoryTitle>
      <ul className="oboard-bullets" data-testid="connect-disclaimer">
        {ONBOARDING_COPY.noticeBullets.map((line) => (
          <li key={line}>
            <InfoIcon size={18} className="nv-icon-accent" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      {gate ? (
        <>
          <Checkbox
            label={ONBOARDING_COPY.checkbox}
            checked={state.rulesChecked}
            onChange={setRulesChecked}
            testId="connect-checkbox"
          />
          <Button
            testId="notice-enter"
            disabled={!canProceed(state)}
            onClick={props.onEnter}
          >
            {ONBOARDING_COPY.enterCta}
          </Button>
        </>
      ) : (
        <Button variant="tertiary" testId="notice-close" onClick={props.onClose}>
          Close
        </Button>
      )}
    </GlassSheet>
  );
}
