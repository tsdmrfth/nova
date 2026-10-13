import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { ChoiceId } from "@nova/assets";
import { useDayStore } from "../day/useDayStore";
import { HomeView } from "../hud/HomeView";
import { VoteView } from "../hud/VoteView";
import { HUD_COPY, buildHomeModel, buildVoteModel } from "../hud/homeHudModel";
import { useCalmMotion } from "../hud/usePrefersReducedMotion";
import { MenuSheet } from "../menu/MenuSheet";
import { GrantToast } from "../onboarding/GrantToast";
import { TutorialOverlay } from "../onboarding/TutorialOverlay";
import { useOnboarding } from "../onboarding/useOnboarding";
import { FrameOverlay, ScreenFrame } from "../ui";

/** Screens 03–05: Home with the first-run toast, tutorial, and Menu on top. */
export function HomePage() {
  const { state, select, ready, error } = useDayStore();
  const onboarding = useOnboarding();
  const navigate = useNavigate();
  const calm = useCalmMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [tutorialLeaving, setTutorialLeaving] = useState(false);
  const model = useMemo(() => {
    const base = buildHomeModel(state);
    return ready ? base : { ...base, ctaLabel: HUD_COPY.loadingCta };
  }, [state, ready]);

  const grant = onboarding.state.grantPending;
  const tutorial = !grant && onboarding.onboarded && !onboarding.state.tutorialSeen;

  const pick = (id: ChoiceId) => {
    if (!ready) return;
    if (!model.locked) {
      select(id);
    }
    navigate("/vote");
  };

  let overlay = null;
  if (menuOpen) {
    overlay = (
      <MenuSheet
        onClose={() => setMenuOpen(false)}
        onHowTo={() => {
          setMenuOpen(false);
          onboarding.reopenTutorial();
        }}
        onGuide={() => navigate("/guide")}
        onDisconnect={onboarding.disconnect}
      />
    );
  } else if (grant) {
    overlay = (
      <FrameOverlay align="top">
        <GrantToast
          freeInfluence={state.freeInfluence}
          reducedMotion={calm}
          onDismiss={onboarding.dismissGrant}
        />
      </FrameOverlay>
    );
  } else if (tutorial) {
    overlay = (
      <FrameOverlay
        align="center"
        scrim
        rise={!calm}
        leaving={tutorialLeaving}
        onLeft={() => {
          setTutorialLeaving(false);
          onboarding.completeTutorial();
        }}
        testId="tutorial-layer"
      >
        <TutorialOverlay
          goal={state.goal}
          onGotIt={() => setTutorialLeaving(true)}
          onSkip={() => setTutorialLeaving(true)}
        />
      </FrameOverlay>
    );
  }

  return (
    <ScreenFrame
      className={grant ? "home-screen home-screen--home is-behind-toast" : "home-screen home-screen--home"}
      overlay={overlay}
      testId="home-screen"
    >
      {error ? <p role="alert">{error}</p> : null}
      <HomeView
        model={model}
        actionsEnabled={ready}
        onPick={pick}
        onPrimary={() => {
          if (!ready) return;
          navigate(model.locked ? "/confirmation" : state.votingOpen ? "/vote" : "/results");
        }}
        onBuyExtra={() => navigate("/buy")}
        onMenu={() => setMenuOpen(true)}
      />
    </ScreenFrame>
  );
}

/** Screen 06. */
export function VotePage() {
  const { state, select, setSpend, setExtraSpend, cast, error, busy, transactionUrl } = useDayStore();
  const navigate = useNavigate();
  const model = useMemo(() => {
    const base = buildVoteModel(state);
    return busy
      ? { ...base, castEnabled: false, castLabel: HUD_COPY.castingCta }
      : base;
  }, [state, busy]);

  return (
    <ScreenFrame className="home-screen home-screen--vote" testId="vote-screen">
      {error ? <p role="alert">{error}</p> : null}
      {transactionUrl && state.status === "cast" ? (
        <a href={transactionUrl} target="_blank" rel="noreferrer">View vote transaction</a>
      ) : null}
      <VoteView
        model={model}
        onBack={() => navigate("/")}
        onSelect={select}
        onSpend={setSpend}
        onExtraSpend={setExtraSpend}
        onCast={async () => {
          if (await cast()) navigate("/confirmation");
        }}
        onViewLocked={() => navigate("/confirmation")}
        onBuyExtra={() => navigate("/buy")}
      />
    </ScreenFrame>
  );
}
