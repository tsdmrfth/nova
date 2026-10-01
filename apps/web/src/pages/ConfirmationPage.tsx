import { useMemo } from "react";
import { useNavigate } from "react-router";
import { ConfirmationHud } from "../confirmation/ConfirmationHud";
import { buildConfirmationModel } from "../confirmation/confirmationModel";
import { useDayStore } from "../day/useDayStore";
import { ScreenFrame } from "../ui";

export function ConfirmationPage() {
  const { state } = useDayStore();
  const navigate = useNavigate();
  const model = useMemo(() => buildConfirmationModel(state), [state]);

  return (
    <ScreenFrame className="home-screen home-screen--confirm" testId="confirmation-screen">
      <ConfirmationHud
        model={model}
        onHome={() => navigate("/")}
        onResults={() => navigate("/results")}
        onVote={() => navigate("/vote")}
        onBuy={() => navigate("/buy")}
      />
    </ScreenFrame>
  );
}
