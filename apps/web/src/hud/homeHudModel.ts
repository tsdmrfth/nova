import type { ChoiceId } from "@nova/assets";

export type HudModel = {
  day: number;
  freeInfluence: number;
  extraInfluence: number;
  usdcLabel: string;
  rankTitle: string;
  rankXp: { current: number; next: number };
  heroTitle: string;
  heroSub: string;
  choices: Array<{
    id: ChoiceId;
    label: string;
    body: string;
    artId: string;
  }>;
  castEnabled: boolean;
  disclaimer: string;
};

export type HudCallbacks = {
  onSelect(id: ChoiceId): void;
  onCast(): void;
  onBuyFreePlus(): void;
  onBuyExtraPlus(): void;
  onUsdcChip(): void;
};

export const HOME_HUD_MODEL: HudModel = {
  day: 7,
  freeInfluence: 10,
  extraInfluence: 0,
  usdcLabel: "USDC",
  rankTitle: "Architect Apprentice",
  rankXp: { current: 1250, next: 2000 },
  heroTitle: "Design today's economy.",
  heroSub: "Your influence shapes the Nova Archipelago.",
  choices: [
    {
      id: "A",
      label: "Stabilize",
      body: "Strengthen systems. Reduce volatility and protect what's built.",
      artId: "tile_stabilize",
    },
    {
      id: "B",
      label: "Expand",
      body: "Grow the network. Unlock new zones and increase capacity.",
      artId: "tile_expand",
    },
    {
      id: "C",
      label: "Route",
      body: "Redirect flows. Improve trade routes and balance resources.",
      artId: "tile_route",
    },
  ],
  castEnabled: true,
  disclaimer:
    "Influence is non-binding but impactful. Outcomes shape the world for all citizens.",
};
