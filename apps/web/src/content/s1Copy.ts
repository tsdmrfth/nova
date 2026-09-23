/**
 * Locked Season 1 UI strings (COPY-S1 B2/B3/B5/B6 + affiliation).
 * Home, Vote, Confirmation, and Results read these — do not retype them in components.
 */
export const S1_COPY = {
  grantTitle: "+10 Free Influence",
  grantBody: "Yours for today. Unused Free burns when the day ends.",
  grantFirstDay: "Use it on today's three choices. You can skip Extra.",
  voteCta: "Cast Influence",
  castSuccess: "Influence cast",
  confirmLocked: (voteCloseLocal: string, publishAtLocal: string) =>
    `Locked until ${voteCloseLocal}. Results publish around ${publishAtLocal}.`,
  pending: "Saving your cast…",
  pendingLeave: "You can leave — we'll keep it.",
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
  resultsNote:
    "Extra Influence does not make a pick more likely to win. SPARK is in-game points — not a token.",
  affiliation:
    "Third-party game on Arc. Not affiliated with Circle's Architects program.",
} as const;
