import type { ReactElement } from "react";
import { NavLink, Navigate, Route, Routes, useLocation } from "react-router";
import { appConfig } from "@nova/config";
import { DayStoreProvider } from "./day/DayStoreProvider";
import { BuyPage } from "./pages/BuyPage";
import { HomePage, VotePage } from "./pages/HomePage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { PRODUCT_ROUTES, type ProductRouteId } from "./productRoutes";
import "./App.css";

const pages: Record<ProductRouteId, ReactElement> = {
  connect: <PlaceholderPage title="Connect" />,
  home: <HomePage />,
  vote: <VotePage />,
  buy: <BuyPage />,
  confirmation: <PlaceholderPage title="Confirmation" />,
  results: <PlaceholderPage title="Results" />,
  neighborhood: <PlaceholderPage title="Nova/Neighborhood" />,
  profile: <PlaceholderPage title="Profile" />,
};

function isCinemaPath(pathname: string): boolean {
  return pathname === "/" || pathname === "/vote" || pathname === "/buy";
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

export function App() {
  return (
    <DayStoreProvider>
      <AppLayout />
    </DayStoreProvider>
  );
}

function AppLayout() {
  const { pathname } = useLocation();
  const cinema = isCinemaPath(pathname);

  return (
    <div className={cinema ? "app-shell app-shell--cinema" : "app-shell"}>
      <header className={cinema ? "app-header app-header--jump" : "app-header"}>
        {cinema ? null : <p className="brand">{appConfig.name}</p>}
        <ProductNav compact={cinema} />
      </header>
      <main className={cinema ? "app-main app-main--cinema" : "app-main"}>
        <Routes>
          {PRODUCT_ROUTES.map((route) => (
            <Route
              key={route.id}
              path={route.path}
              element={pages[route.id]}
            />
          ))}
          <Route path="/nova" element={<Navigate to="/neighborhood" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
