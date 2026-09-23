import type { Cast, PackId } from "@nova/shared";

/**
 * Offline crowd for the Phase 1 results demo. Extra never picks W*;
 * Day 1 MOST is Expand (B) from Free tallies: A 200 / B 500 / C 300.
 * Pack list matches the POOL-DISTRIBUTION worked example (20 Spark + 8 Pulse).
 */
export const CROWD_PACKS: PackId[] = [
  ...Array.from({ length: 20 }, () => "spark" as const),
  ...Array.from({ length: 8 }, () => "pulse" as const),
];

function rangeCasts(
  prefix: string,
  count: number,
  optionId: string,
  extra: number,
  free: number,
): Cast[] {
  return Array.from({ length: count }, (_, index) => ({
    walletId: `${prefix}-${String(index).padStart(2, "0")}`,
    optionId,
    extra,
    free,
  }));
}

export function crowdCasts(): Cast[] {
  return [
    ...rangeCasts("free-a", 20, "A", 0, 10),
    ...rangeCasts("free-b", 50, "B", 0, 10),
    ...rangeCasts("free-c", 30, "C", 0, 10),
    { walletId: "paid-b-40", optionId: "B", extra: 40, free: 0 },
    { walletId: "paid-b-30a", optionId: "B", extra: 30, free: 0 },
    { walletId: "paid-b-30b", optionId: "B", extra: 30, free: 0 },
    { walletId: "paid-lose-a", optionId: "A", extra: 270, free: 0 },
    { walletId: "paid-lose-c", optionId: "C", extra: 270, free: 0 },
  ];
}
