/** Pending lock after Cast. EN-first. No yield / odds language. */
export const CONFIRMATION_COPY = {
  kicker: "Confirmation",
  titleLocked: "Vote locked",
  titleOpen: "Nothing locked yet",
  pending: "Your Influence is locked until voting closes.",
  emptyBody: "Cast Influence on today's three choices to lock this day.",
  choiceLabel: "Your pick",
  freeLabel: "Free Influence",
  extraLabel: "Extra Influence",
  notCast: "Not cast",
  onPick: (amount: number) => `${amount} on this pick`,
  remaining: (amount: number) => `${amount} remaining`,
  closeLabel: "Voting closes",
  publishLabel: "Results publish",
  resultsCta: "See results",
  castCta: "Cast Influence",
  reviewCta: "Review confirmation",
  back: "Back to vote",
  buy: "Extra Influence",
  lanes:
    "Free and Extra stay in separate lanes. Extra does not make a pick more likely to win.",
} as const;
