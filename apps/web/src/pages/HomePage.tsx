import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { ChoiceId } from "@nova/assets";
import { useDayStore } from "../day/useDayStore";
import { HomeView } from "../hud/HomeView";
import { VoteView } from "../hud/VoteView";
import { buildHomeModel, buildVoteModel } from "../hud/homeHudModel";
import { useCalmMotion } from "../hud/usePrefersReducedMotion";
import { MenuSheet } from "../menu/MenuSheet";
import { GrantToast } from "../onboarding/GrantToast";
import { TutorialOverlay } from "../onboarding/TutorialOverlay";
import { useOnboarding } from "../onboarding/useOnboarding";
import { FrameOverlay, ScreenFrame } from "../ui";

/** Screens 03–05: Home with the first-run toast, tutorial, and Menu on top. */
export function HomePage() {
  const { state, select } = useDayStore();
  const onboarding = useOnboarding();
  const navigate = useNavigate();
  const calm = useCalmMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const model = useMemo(() => buildHomeModel(state), [state]);

  const grant = onboarding.state.grantPending;
  const tutorial = !grant && onboarding.onboarded && !onboarding.state.tutorialSeen;

  const pick = (id: ChoiceId) => {
    if (!model.locked) {
      select(id);
    }
    navigate("/vote");
  };

  let overlay = null;
  if (menuOpen) {
    overlay = (
      <FrameOverlay align="fill" testId="menu-overlay">
        <MenuSheet
          onClose={() => setMenuOpen(false)}
          onHowTo={() => {
            setMenuOpen(false);
            onboarding.reopenTutorial();
          }}
          onPools={() => navigate("/buy")}
          onDisconnect={onboarding.disconnect}
        />
      </FrameOverlay>
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
      <FrameOverlay align="center">
        <TutorialOverlay
          goal={state.goal}
          onGotIt={onboarding.completeTutorial}
          onSkip={onboarding.completeTutorial}
        />
      </FrameOverlay>
    );
  }

  return (
    <ScreenFrame
      className={grant ? "home-screen home-screen--home is-behind-toast" : "home-screen home-screen--home"}
      dim={menuOpen || tutorial}
      overlay={overlay}
      testId="home-screen"
    >
      <HomeView
        model={model}
        onPick={pick}
        onPrimary={() => navigate(model.locked ? "/confirmation" : "/vote")}
        onBuyExtra={() => navigate("/buy")}
        onMenu={() => setMenuOpen(true)}
      />
    </ScreenFrame>
  );
}

/** Screen 06. */
export function VotePage() {
  const { state, select, setSpend, setExtraSpend, cast } = useDayStore();
  const navigate = useNavigate();
  const model = useMemo(() => buildVoteModel(state), [state]);

  return (
    <ScreenFrame className="home-screen home-screen--vote" testId="vote-screen">
      <VoteView
        model={model}
        onBack={() => navigate("/")}
        onSelect={select}
        onSpend={setSpend}
        onExtraSpend={setExtraSpend}
        onCast={() => {
          cast();
          navigate("/confirmation");
        }}
        onViewLocked={() => navigate("/confirmation")}
        onBuyExtra={() => navigate("/buy")}
      />
    </ScreenFrame>
  );
}
