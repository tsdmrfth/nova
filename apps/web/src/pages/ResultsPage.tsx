import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useDayStore } from "../day/useDayStore";
import { useCalmMotion } from "../hud/usePrefersReducedMotion";
import { ClaimDoneSheet, ClaimPendingSheet, ResultsHud } from "../results/ResultsHud";
import { buildResultsModel } from "../results/resultsModel";
import { RESULTS_COPY } from "../results/resultsCopy";
import { ScreenFrame } from "../ui";

/** Screens 08–11 from the pool's latest settled day. Claim Done shows once, right after confirmation. */
export function ResultsPage() {
  const { result, ready, claim, claimStatus, claimUrl, error } = useDayStore();
  const navigate = useNavigate();
  const calm = useCalmMotion();
  const model = useMemo(() => (result ? buildResultsModel(result, claimStatus) : null), [result, claimStatus]);
  const previous = useRef(claimStatus);
  const [justClaimed, setJustClaimed] = useState(false);

  useEffect(() => {
    if (previous.current === "pending" && claimStatus === "claimed") {
      setJustClaimed(true);
    }
    previous.current = claimStatus;
  }, [claimStatus]);

  const submitClaim = () => void claim();
  const home = () => navigate("/");

  if (!model) {
    return (
      <ScreenFrame className="home-screen home-screen--results" testId="results-screen">
        <p data-testid="results-waiting">{ready ? RESULTS_COPY.notSettled : RESULTS_COPY.loading}</p>
        {error ? <p role="alert">{error}</p> : null}
        <button onClick={home}>{RESULTS_COPY.backHome}</button>
      </ScreenFrame>
    );
  }

  let body;
  if (claimStatus === "pending" || claimStatus === "failed") {
    body = (
      <ClaimPendingSheet
        model={model}
        calm={calm}
        explorerUrl={claimUrl}
        onRetry={submitClaim}
        onBack={home}
      />
    );
  } else if (justClaimed) {
    body = <ClaimDoneSheet model={model} explorerUrl={claimUrl} onBack={home} />;
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
      {claimStatus === "failed" && error ? <p role="alert">{error}</p> : null}
      {body}
    </ScreenFrame>
  );
}
