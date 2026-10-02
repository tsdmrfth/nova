import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useDayStore } from "../day/useDayStore";
import { useCalmMotion } from "../hud/usePrefersReducedMotion";
import { ClaimDoneSheet, ClaimPendingSheet, ResultsHud } from "../results/ResultsHud";
import { buildResultsModel } from "../results/resultsModel";
import { settleOffline, snapshotFromSettle } from "../results/settleMock";
import { ScreenFrame } from "../ui";

/** Screens 08–11. Claim Done shows once, right after confirmation. */
export function ResultsPage() {
  const { state, claim, offline } = useDayStore();
  const navigate = useNavigate();
  const calm = useCalmMotion();
  const settled = useMemo(() => settleOffline(state), [state]);
  const model = useMemo(() => buildResultsModel(state, settled), [state, settled]);
  const previous = useRef(state.claimStatus);
  const [justClaimed, setJustClaimed] = useState(false);

  useEffect(() => {
    if (previous.current === "pending" && state.claimStatus === "claimed") {
      setJustClaimed(true);
    }
    previous.current = state.claimStatus;
  }, [state.claimStatus]);

  const submitClaim = () => claim(snapshotFromSettle(settled));
  const home = () => navigate("/");

  if (!offline) return (
    <ScreenFrame className="home-screen home-screen--results" testId="results-screen">
      <p>Results and payout claims are not available yet.</p>
      <button onClick={home}>Back home</button>
    </ScreenFrame>
  );

  let body;
  if (state.claimStatus === "pending" || state.claimStatus === "failed") {
    body = (
      <ClaimPendingSheet
        model={model}
        calm={calm}
        explorerUrl={null}
        onRetry={submitClaim}
        onBack={home}
      />
    );
  } else if (justClaimed) {
    body = <ClaimDoneSheet model={model} explorerUrl={null} onBack={home} />;
  } else {
    body = (
      <ResultsHud
        model={model}
        calm={calm}
        onClaim={submitClaim}
        onBack={home}
        onVote={() => navigate("/vote")}
      />
    );
  }

  return (
    <ScreenFrame className="home-screen home-screen--results" testId="results-screen">
      {body}
    </ScreenFrame>
  );
}
