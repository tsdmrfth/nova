/** Screen 07 (Vote locked). EN-first. No yield / odds language. */
export const CONFIRMATION_COPY = {
  backLabel: "Cast Influence",
  titleLocked: "Vote locked",
  titleOpen: "Nothing locked yet",
  pending: "Your Influence is cast.",
  emptyBody: "Cast Influence on today's three choices to lock this day.",
  freeSpent: "Free spent",
  extraSpent: "Extra spent",
  remaining: "Remaining",
  closeLabel: "Vote closes",
  publishLabel: "Results publish",
  resultsCta: "See results",
  resultsAt: (time: string) => `See results · ${time}`,
  homeCta: "Back to Nova",
  castCta: "Cast Influence",
  back: "Back to vote · View only",
  buy: "Extra Influence",
  lanes:
    "Free and Extra stay in separate lanes. Extra does not make a pick more likely to win.",
} as const;
