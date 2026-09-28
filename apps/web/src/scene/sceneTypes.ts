import type { ChoiceId, DayScenePack } from "@nova/assets";

export type ScenePhase =
  | "idle"
  | "choosing"
  | "pending"
  | "reveal"
  | "win"
  | "miss";

export type SceneStageProps = {
  pack: DayScenePack;
  /** Working-set pose id. Defaults to the pack sprite. */
  novaId?: string;
  selected: ChoiceId | null;
  phase: ScenePhase;
  reducedMotion: boolean;
  dpr: number;
  className?: string;
  onReady?: () => void;
};

export type SceneStageHandle = {
  hibernate(): void;
  resume(): void;
  destroy(): void;
};
