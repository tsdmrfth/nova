import { useNavigate } from "react-router";
import { ConnectHud, GeoBlockHud } from "../onboarding/ConnectHud";

export function ConnectPage() {
  const navigate = useNavigate();
  return <ConnectHud onEnter={() => navigate("/")} />;
}

export function GeoBlockPage() {
  return <GeoBlockHud />;
}
