import {
  NOVA_BUDGET_LABEL,
  PLATFORM_FEE_LABEL,
  buySplitPercents,
  grantDailyFree,
  type DayGoal,
} from "@nova/shared";

const buyPercents = buySplitPercents();
const dailyFree = grantDailyFree();

/**
 * The winner is picked from every player's Free Influence, so the goal says what to guess.
 * Plain words: the HUD's GOAL chip only shows the bare MOST / LEAST / MIDDLE.
 */
const GOAL_STEPS: Record<DayGoal, { title: string; body: string }> = {
  MOST: {
    title: "Today, the most votes wins",
    body: "Pick the choice you think most players will pick.",
  },
  LEAST: {
    title: "Today, the fewest votes wins",
    body: "Pick the choice you think most players will skip.",
  },
  MIDDLE: {
    title: "Today, second place wins",
    body: "Not the most votes, not the fewest. Pick the choice you think will come second.",
  },
};

/** UI-KIT-V2 screens 01–04 + ONBOARDING-EDGE-COPY. EN-first. */
export const ONBOARDING_COPY = {
  wordmark: "NOVA",
  headline: "Raise Nova, one choice a day.",
  subline: "A daily story game with programmable USDC on Arc.",
  signInKicker: "Sign in",
  connectCta: "Connect Arc wallet",
  footerMicro:
    "You're an Architect in-game — not Circle's official program. Third-party on Arc.",
  noticeTag: "Soft launch",
  noticeTitle: "Before you play",
  noticeBullets: [
    "Nova is a story game. Nova is a scripted AI agent, not general intelligence.",
    `Free Influence refills daily. Extra Influence is optional and paid in USDC on Arc: ${buyPercents.prizePool}% to that day's prize pool, ${buyPercents.studioNet}% ${PLATFORM_FEE_LABEL}, ${buyPercents.novaBudget}% ${NOVA_BUDGET_LABEL}.`,
    "Free and Extra are counted in separate lanes. Extra doesn't make your pick more likely to win.",
    "Payouts come only from each day's pool and can be zero. Contracts are new. Not financial advice.",
    "Nova runs on Arc and is not affiliated with or endorsed by Circle or its Architects program. Soft launch geo rules may apply.",
  ],
  checkbox: "I understand this is a soft launch",
  enterCta: "Enter Nova",
  grantTitle: `Free Influence +${dailyFree}`,
  grantOrb: `+${dailyFree}`,
  grantBody: "Today's refill is in. Spend it on any choice.",
  tutorialKicker: "First light",
  tutorialTitle: "How today works",
  /** Title + one short line each, in plain words. The goal step changes per goal. */
  tutorialSteps: (goal: DayGoal) => [
    {
      title: "Read the story",
      body: "Nova must choose: A, B or C.",
    },
    {
      title: "Vote",
      body: `You get ${dailyFree} Free Influence a day. Each one is a vote. Put them on one choice. You can't change it later.`,
    },
    {
      title: GOAL_STEPS[goal].title,
      body: `${GOAL_STEPS[goal].body} This changes every day: see GOAL at the top.`,
    },
    {
      title: "Guessed right? Share the prize",
      body: "Everyone on the winning choice splits today's prize. More votes, bigger share. Some days the prize is zero.",
    },
  ],
  tutorialGotIt: "Got it",
  tutorialSkip: "Skip",
  rejectTitle: "Wallet not connected",
  rejectBody: "Connect to play. No charge to connect.",
  rejectCta: "Try again",
  networkTitle: "Switch to Arc",
  networkBody: "Nova runs on Arc. Switch networks, then retry.",
  networkSwitch: "Switch to Arc",
  networkRetry: "Retry",
  lockedTitle: "Unlock your wallet",
  lockedBody: "Approve the connection request in your wallet.",
  lockedCta: "Open wallet",
  geoTitle: "Not available here yet",
  geoBody:
    "Nova isn't available in your region yet. Soft launch is limited by geography. This isn't financial advice and isn't affiliated with Circle's Architects program.",
  geoCta: "OK",
} as const;

/** Toast slides down 240ms, then holds 2.4s. */
export const GRANT_TOAST_MS = 2640;
