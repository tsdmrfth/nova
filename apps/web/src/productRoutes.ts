export const PRODUCT_ROUTES = [
  { id: "connect", path: "/connect", label: "Connect" },
  { id: "home", path: "/", label: "Home" },
  { id: "vote", path: "/vote", label: "Vote" },
  { id: "buy", path: "/buy", label: "Buy" },
  { id: "confirmation", path: "/confirmation", label: "Confirmation" },
  { id: "results", path: "/results", label: "Results" },
  { id: "neighborhood", path: "/neighborhood", label: "Nova/Neighborhood" },
  { id: "profile", path: "/profile", label: "Profile" },
] as const;

export type ProductRoute = (typeof PRODUCT_ROUTES)[number];
export type ProductRouteId = ProductRoute["id"];
