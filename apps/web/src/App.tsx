import type { ReactElement } from "react";
import { NavLink, Navigate, Route, Routes, useLocation } from "react-router";
import { appConfig } from "@nova/config";
import { DayStoreProvider } from "./day/DayStoreProvider";
import { OnboardingProvider } from "./onboarding/OnboardingProvider";
import { useOnboarding } from "./onboarding/useOnboarding";
import { BuyPage } from "./pages/BuyPage";
import { ConfirmationPage } from "./pages/ConfirmationPage";
import { ConnectPage, GeoBlockPage } from "./pages/ConnectPage";
import { HomePage, VotePage } from "./pages/HomePage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ResultsPage } from "./pages/ResultsPage";
import { PRODUCT_ROUTES, type ProductRouteId } from "./productRoutes";
import "./App.css";

const pages: Record<ProductRouteId, ReactElement> = {
  connect: <ConnectPage />,
  home: <HomePage />,
  vote: <VotePage />,
  buy: <BuyPage />,
  confirmation: <ConfirmationPage />,
  results: <ResultsPage />,
  neighborhood: <PlaceholderPage title="Nova/Neighborhood" />,
  profile: <ProfilePage />,
};

function isCinemaPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/connect" ||
    pathname === "/vote" ||
    pathname === "/buy" ||
    pathname === "/confirmation" ||
    pathname === "/results"
  );
}

function ProductNav({ compact }: { compact: boolean }) {
  const links = PRODUCT_ROUTES.map((route) => (
    <NavLink key={route.id} to={route.path} end={route.path === "/"}>
      {route.label}
    </NavLink>
  ));

  if (!compact) {
    return (
      <nav className="app-nav" aria-label="Product">
        {links}
      </nav>
    );
  }

  return (
    <details className="page-jump">
      <summary>Menu</summary>
      <nav className="app-nav app-nav--panel" aria-label="Product">
        {links}
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
  const { pathname } = useLocation();
  const { state } = useOnboarding();
  const cinema = isCinemaPath(pathname) || state.geoBlocked;

  return (
    <div className={cinema ? "app-shell app-shell--cinema" : "app-shell"}>
      <header className={cinema ? "app-header app-header--jump" : "app-header"}>
        {cinema ? null : <p className="brand">{appConfig.name}</p>}
        <ProductNav compact={cinema} />
      </header>
      <main className={cinema ? "app-main app-main--cinema" : "app-main"}>
        {state.geoBlocked ? (
          <GeoBlockPage />
        ) : (
          <Routes>
            {PRODUCT_ROUTES.map((route) => (
              <Route
                key={route.id}
                path={route.path}
                element={
                  route.id === "connect" ? (
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
        )}
      </main>
    </div>
  );
}
