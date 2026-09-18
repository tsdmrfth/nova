/** COPY-S1 B6 + PRE-CODE-LOCKS claim-on-Results. */
export const RESULTS_COPY = {
  canonToday: (optionName: string) => `Canon today: ${optionName}`,
  dayGoal: (goal: string) => `Day goal was ${goal}`,
  paidPool: (amount: string) => `Paid pool: ${amount} USDC`,
  freePool: (amount: string) => `Free pool: ${amount} USDC`,
  miss: "No pool share today",
  rollover: "Nobody hit today's goal. Pool rolls to tomorrow.",
  claim: (amount: string) => `Claim ${amount} USDC`,
  claimPending: "Claim pending…",
  claimed: "Claimed",
  share: "Share",
  shareDone: "Copied",
  back: "Back to Nova",
  sparkLabel: "SPARK",
  sparkHint: "In-game points. Not money and not a token.",
  needCast: "Cast Influence on today's three choices to lock a share.",
  voteCta: "Cast Influence",
} as const;
