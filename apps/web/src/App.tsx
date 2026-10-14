import { useEffect, useMemo, type ReactElement } from "react";
import { NavLink, Navigate, Route, Routes, useLocation } from "react-router";
import { lazyArcChain } from "./chain/lazyArcChain";
import { NovaChainContext } from "./chain/chainContext";
import type { NovaChain } from "./chain/novaChain";
import { DayStoreProvider } from "./day/DayStoreProvider";
import { readDemoConfig } from "./demo/demoConfig";
import { GrantDemoPage } from "./demo/GrantDemoPage";
import { usePref } from "./menu/prefs";
import { OnboardingProvider } from "./onboarding/OnboardingProvider";
import { useOnboarding } from "./onboarding/useOnboarding";
import { BuyPage } from "./pages/BuyPage";
import { ConfirmationPage } from "./pages/ConfirmationPage";
import { ConnectPage, GeoBlockPage } from "./pages/ConnectPage";
import { GuidePage } from "./pages/GuidePage";
import { HomePage, VotePage } from "./pages/HomePage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { ResultsPage } from "./pages/ResultsPage";
import { PRODUCT_ROUTES, type ProductRouteId } from "./productRoutes";
import { screenMotion } from "./screenFlow";
import { ScreenMotionProvider } from "./ui";
import "./App.css";

const pages: Record<ProductRouteId, ReactElement> = {
  connect: <ConnectPage />,
  home: <HomePage />,
  vote: <VotePage />,
  buy: <BuyPage />,
  guide: <GuidePage />,
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
  const { onboarded, walletChecked, state, account } = useOnboarding();
  if (!onboarded && !walletChecked) {
    return null;
  }
  // Disclaimer not accepted → go to /connect
  if (!onboarded) {
    return <Navigate to="/connect" replace />;
  }
  // Wallet connected but on wrong network → show network-switch screen
  if (account && state.network === "wrong") {
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

/** `chain` is injectable for tests; the app reads the configured Arc pool. */
export function App({ chain }: { chain?: NovaChain | null }) {
  const resolved = useMemo(
    () => (chain !== undefined ? chain : lazyArcChain(readDemoConfig())),
    [chain],
  );
  return (
    <NovaChainContext.Provider value={resolved}>
      <OnboardingProvider>
        <DayStoreProvider>
          <AppLayout />
        </DayStoreProvider>
      </OnboardingProvider>
    </NovaChainContext.Provider>
  );
}

function AppLayout() {
  const { state } = useOnboarding();
  const { pathname } = useLocation();

  return (
    <div className="app-shell">
      <CalmMotionRoot />
      {import.meta.env.DEV ? <DevRouteJump /> : null}
      <main className="app-main">
        <ScreenMotionProvider path={pathname} resolve={screenMotion}>
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
        </ScreenMotionProvider>
      </main>
    </div>
  );
}
