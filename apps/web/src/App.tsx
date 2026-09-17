import type { ReactElement } from "react";
import { NavLink, Navigate, Route, Routes, useLocation } from "react-router";
import { appConfig } from "@nova/config";
import { HomePage } from "./pages/HomePage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { PRODUCT_ROUTES, type ProductRouteId } from "./productRoutes";
import "./App.css";

const pages: Record<ProductRouteId, ReactElement> = {
  connect: <PlaceholderPage title="Connect" />,
  home: <HomePage />,
  vote: <PlaceholderPage title="Vote" />,
  buy: <PlaceholderPage title="Buy" />,
  confirmation: <PlaceholderPage title="Confirmation" />,
  results: <PlaceholderPage title="Results" />,
  neighborhood: <PlaceholderPage title="Nova/Neighborhood" />,
  profile: <PlaceholderPage title="Profile" />,
};

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
  const { pathname } = useLocation();
  const cinema = pathname === "/";

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
