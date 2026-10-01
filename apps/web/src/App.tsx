import { useEffect, type ReactElement } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router";
import { DayStoreProvider } from "./day/DayStoreProvider";
import { GrantDemoPage } from "./demo/GrantDemoPage";
import { usePref } from "./menu/prefs";
import { OnboardingProvider } from "./onboarding/OnboardingProvider";
import { useOnboarding } from "./onboarding/useOnboarding";
import { BuyPage } from "./pages/BuyPage";
import { ConfirmationPage } from "./pages/ConfirmationPage";
import { ConnectPage, GeoBlockPage } from "./pages/ConnectPage";
import { HomePage, VotePage } from "./pages/HomePage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { ResultsPage } from "./pages/ResultsPage";
import { PRODUCT_ROUTES, type ProductRouteId } from "./productRoutes";
import "./ui";
import "./App.css";

const pages: Record<ProductRouteId, ReactElement> = {
  connect: <ConnectPage />,
  home: <HomePage />,
  vote: <VotePage />,
  buy: <BuyPage />,
  confirmation: <ConfirmationPage />,
  results: <ResultsPage />,
  neighborhood: <PlaceholderPage title="Nova/Neighborhood" />,
  // Profile lives in the Menu sheet now (UI-KIT-V2 screen 13).
  profile: <Navigate to="/" replace />,
};

/** Dev-only route jumper; players navigate through the HUD and Menu. */
function DevRouteJump() {
  return (
    <details className="dev-jump">
      <summary>Routes</summary>
      <nav aria-label="Dev routes">
        {PRODUCT_ROUTES.map((route) => (
          <NavLink key={route.id} to={route.path} end={route.path === "/"}>
            {route.label}
          </NavLink>
        ))}
        <NavLink to="/demo">Demo</NavLink>
      </nav>
    </details>
  );
}

function PlayGate({ children }: { children: ReactElement }) {
  const { onboarded } = useOnboarding();
  if (!onboarded) {
    return <Navigate to="/connect" replace />;
  }
  return children;
}

/** Calm motion (Menu) applies app-wide, alongside prefers-reduced-motion. */
function CalmMotionRoot() {
  const [calm] = usePref("calmMotion");
  useEffect(() => {
    const root = document.documentElement;
    if (calm) {
      root.dataset.calm = "true";
    } else {
      delete root.dataset.calm;
    }
  }, [calm]);
  return null;
}

export function App() {
  return (
    <DayStoreProvider>
      <OnboardingProvider>
        <AppLayout />
      </OnboardingProvider>
    </DayStoreProvider>
  );
}

function AppLayout() {
  const { state } = useOnboarding();

  return (
    <div className="app-shell">
      <CalmMotionRoot />
      {import.meta.env.DEV ? <DevRouteJump /> : null}
      <main className="app-main">
        <Routes>
          <Route path="/demo" element={<GrantDemoPage />} />
          {PRODUCT_ROUTES.map((route) => (
            <Route
              key={route.id}
              path={route.path}
              element={
                state.geoBlocked ? (
                  <GeoBlockPage />
                ) : route.id === "connect" ? (
                  pages[route.id]
                ) : (
                  <PlayGate>{pages[route.id]}</PlayGate>
                )
              }
            />
          ))}
          <Route path="/nova" element={<Navigate to="/neighborhood" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
