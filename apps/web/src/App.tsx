import type { ReactElement } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router";
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

export function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="brand">{appConfig.name}</p>
        <nav className="app-nav" aria-label="Product">
          {PRODUCT_ROUTES.map((route) => (
            <NavLink
              key={route.id}
              to={route.path}
              end={route.path === "/"}
            >
              {route.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="app-main">
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
