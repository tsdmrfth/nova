import { Button, FrameOverlay, GlassSheet, Kicker, ScreenFrame, StoryTitle, WalletIcon } from "../ui";
import { ONBOARDING_COPY } from "./onboardingCopy";
import { SoftLaunchNotice } from "./SoftLaunchNotice";
import { useOnboarding } from "./useOnboarding";
import "./onboarding.css";

type Action = { testId: string; label: string; onClick: () => void };

/** Screen 01 hero: wordmark + story line on the plate, left of Nova. */
function ConnectHero() {
  return (
    <header className="oboard-hero nv-plate-copy nv-text-plate" data-testid="connect-body">
      <p className="nv-wordmark">{ONBOARDING_COPY.wordmark}</p>
      <StoryTitle size="md">{ONBOARDING_COPY.headline}</StoryTitle>
      <p className="oboard-hero__sub">{ONBOARDING_COPY.subline}</p>
    </header>
  );
}

/** Bottom sign-in sheet; edge faces reuse it with their own title/body. */
export function EdgeSheet({
  testId,
  title,
  body,
  primary,
  secondary,
}: {
  testId: string;
  title: string;
  body: string;
  primary: Action;
  secondary?: Action;
}) {
  return (
    <GlassSheet testId={testId} className="oboard-signin">
      <Kicker tone="muted">{ONBOARDING_COPY.signInKicker}</Kicker>
      <StoryTitle size="sm" as="h2">
        {title}
      </StoryTitle>
      <p className="nv-body nv-muted">{body}</p>
      <Button testId={primary.testId} onClick={primary.onClick}>
        {primary.label}
      </Button>
      {secondary ? (
        <Button variant="tertiary" testId={secondary.testId} onClick={secondary.onClick}>
          {secondary.label}
        </Button>
      ) : null}
    </GlassSheet>
  );
}

function SignInSheet({ onEnter }: { onEnter: () => void }) {
  const { connect } = useOnboarding();
  return (
    <GlassSheet testId="connect-welcome" className="oboard-signin">
      <Kicker tone="muted">{ONBOARDING_COPY.signInKicker}</Kicker>
      <Button
        testId="connect-cta"
        onClick={() => {
          if (connect()) {
            onEnter();
          }
        }}
      >
        <WalletIcon />
        {ONBOARDING_COPY.connectCta}
      </Button>
      <p className="nv-note" data-testid="connect-footer">
        {ONBOARDING_COPY.footerMicro}
      </p>
    </GlassSheet>
  );
}

function EdgeFace({ onEnter }: { onEnter: () => void }) {
  const { state, switchToArc, retryConnect, retryWallet, openWallet } = useOnboarding();

  if (state.face === "network") {
    return (
      <EdgeSheet
        testId="network-block"
        title={ONBOARDING_COPY.networkTitle}
        body={ONBOARDING_COPY.networkBody}
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
    return (
      <EdgeSheet
        testId="wallet-rejected"
        title={ONBOARDING_COPY.rejectTitle}
        body={ONBOARDING_COPY.rejectBody}
        primary={{
          testId: "wallet-retry",
          label: ONBOARDING_COPY.rejectCta,
          onClick: retryWallet,
        }}
      />
    );
  }

  if (state.face === "locked") {
    return (
      <EdgeSheet
        testId="wallet-locked"
        title={ONBOARDING_COPY.lockedTitle}
        body={ONBOARDING_COPY.lockedBody}
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

  return <SignInSheet onEnter={onEnter} />;
}

/** Screens 01 (Connect) + 02 (Soft-launch notice) on `/connect`. */
export function ConnectHud({ onEnter }: { onEnter: () => void }) {
  const { state, enterNova } = useOnboarding();
  const notice = state.face === "notice";

  return (
    <ScreenFrame
      className="home-screen--connect"
      dim={notice}
      overlay={
        notice ? (
          <FrameOverlay align="center">
            <SoftLaunchNotice
              onEnter={() => {
                if (enterNova()) {
                  onEnter();
                }
              }}
            />
          </FrameOverlay>
        ) : null
      }
    >
      {notice ? null : (
        <>
          <ConnectHero />
          <div className="nv-bottom">
            <EdgeFace onEnter={onEnter} />
          </div>
        </>
      )}
    </ScreenFrame>
  );
}

export function GeoBlockHud() {
  return (
    <ScreenFrame className="home-screen--connect">
      <ConnectHero />
      <div className="nv-bottom">
        <EdgeSheet
          testId="geo-block"
          title={ONBOARDING_COPY.geoTitle}
          body={ONBOARDING_COPY.geoBody}
          primary={{
            testId: "geo-ok",
            label: ONBOARDING_COPY.geoCta,
            onClick: () => undefined,
          }}
        />
      </div>
    </ScreenFrame>
  );
}
