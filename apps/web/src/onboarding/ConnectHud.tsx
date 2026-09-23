import type { ReactNode } from "react";
import { ShieldIcon } from "../hud/hudIcons";
import { canProceed, type ConnectFace } from "./onboardingModel";
import { ONBOARDING_COPY } from "./onboardingCopy";
import { useOnboarding } from "./useOnboarding";
import "./onboarding.css";

type EdgeProps = {
  testId: string;
  title: string;
  body: string;
  primary: { testId: string; label: string; onClick: () => void };
  secondary?: { testId: string; label: string; onClick: () => void };
};

export function OnboardingPanel({
  testId,
  title,
  body,
  children,
}: {
  testId: string;
  title: string;
  body?: string;
  children: ReactNode;
}) {
  return (
    <div className="oboard-hud">
      <section className="oboard-panel" data-testid={testId}>
        <p className="oboard-kicker">Nova</p>
        <h1 className="oboard-title">{title}</h1>
        {body ? (
          <div className="oboard-body">
            <p>{body}</p>
          </div>
        ) : null}
        {children}
      </section>
    </div>
  );
}

export function EdgePanel({
  testId,
  title,
  body,
  primary,
  secondary,
}: EdgeProps) {
  return (
    <OnboardingPanel testId={testId} title={title} body={body}>
      <div className="oboard-actions">
        <button
          type="button"
          className="oboard-cta"
          data-testid={primary.testId}
          onClick={primary.onClick}
        >
          {primary.label}
          <span aria-hidden="true">›</span>
        </button>
        {secondary ? (
          <button
            type="button"
            className="oboard-secondary"
            data-testid={secondary.testId}
            onClick={secondary.onClick}
          >
            {secondary.label}
          </button>
        ) : null}
      </div>
    </OnboardingPanel>
  );
}

function WelcomePanel({ onEnter }: { onEnter: () => void }) {
  const { state, setRulesChecked, connect, continueAsMock } = useOnboarding();
  const enabled = canProceed(state);

  const enter = (fn: () => boolean) => {
    if (fn()) {
      onEnter();
    }
  };

  return (
    <OnboardingPanel testId="connect-welcome" title={ONBOARDING_COPY.headline}>
      <div className="oboard-body" data-testid="connect-body">
        {ONBOARDING_COPY.body.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      <p className="oboard-disclaimer" data-testid="connect-disclaimer">
        {ONBOARDING_COPY.disclaimer}
      </p>
      <label className="oboard-check">
        <input
          type="checkbox"
          data-testid="connect-checkbox"
          checked={state.rulesChecked}
          onChange={(event) => setRulesChecked(event.target.checked)}
        />
        <span>{ONBOARDING_COPY.checkbox}</span>
      </label>
      <div className="oboard-actions">
        <button
          type="button"
          className="oboard-cta"
          data-testid="connect-cta"
          disabled={!enabled}
          onClick={() => enter(connect)}
        >
          {ONBOARDING_COPY.connectCta}
          <span aria-hidden="true">›</span>
        </button>
        <button
          type="button"
          className="oboard-secondary"
          data-testid="connect-continue"
          disabled={!enabled}
          onClick={() => enter(continueAsMock)}
        >
          {ONBOARDING_COPY.continueCta}
        </button>
      </div>
      <div className="oboard-footnotes">
        <p>
          <ShieldIcon className="oboard-shield" />
          {ONBOARDING_COPY.feePool}
        </p>
        <p>{ONBOARDING_COPY.feeRisk}</p>
        <p>{ONBOARDING_COPY.feeAffiliation}</p>
      </div>
      <p className="oboard-footer" data-testid="connect-footer">
        {ONBOARDING_COPY.footerMicro}
      </p>
    </OnboardingPanel>
  );
}

function faceCopy(face: ConnectFace) {
  if (face === "network") {
    return {
      testId: "network-block",
      title: ONBOARDING_COPY.networkTitle,
      body: ONBOARDING_COPY.networkBody,
    };
  }
  if (face === "rejected") {
    return {
      testId: "wallet-rejected",
      title: ONBOARDING_COPY.rejectTitle,
      body: ONBOARDING_COPY.rejectBody,
    };
  }
  return {
    testId: "wallet-locked",
    title: ONBOARDING_COPY.lockedTitle,
    body: ONBOARDING_COPY.lockedBody,
  };
}

export function ConnectHud({ onEnter }: { onEnter: () => void }) {
  const {
    state,
    switchToArc,
    retryConnect,
    retryWallet,
    openWallet,
  } = useOnboarding();

  if (state.face === "welcome") {
    return <WelcomePanel onEnter={onEnter} />;
  }

  if (state.face === "network") {
    const copy = faceCopy("network");
    return (
      <EdgePanel
        {...copy}
        primary={{
          testId: "network-switch",
          label: ONBOARDING_COPY.networkSwitch,
          onClick: switchToArc,
        }}
        secondary={{
          testId: "network-retry",
          label: ONBOARDING_COPY.networkRetry,
          onClick: () => {
            if (retryConnect()) {
              onEnter();
            }
          },
        }}
      />
    );
  }

  if (state.face === "rejected") {
    const copy = faceCopy("rejected");
    return (
      <EdgePanel
        {...copy}
        primary={{
          testId: "wallet-retry",
          label: ONBOARDING_COPY.rejectCta,
          onClick: retryWallet,
        }}
      />
    );
  }

  const copy = faceCopy("locked");
  return (
    <EdgePanel
      {...copy}
      primary={{
        testId: "wallet-open",
        label: ONBOARDING_COPY.lockedCta,
        onClick: () => {
          if (openWallet()) {
            onEnter();
          }
        },
      }}
    />
  );
}

export function GeoBlockHud() {
  return (
    <EdgePanel
      testId="geo-block"
      title={ONBOARDING_COPY.geoTitle}
      body={ONBOARDING_COPY.geoBody}
      primary={{
        testId: "geo-ok",
        label: ONBOARDING_COPY.geoCta,
        onClick: () => undefined,
      }}
    />
  );
}
