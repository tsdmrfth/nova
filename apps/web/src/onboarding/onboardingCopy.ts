/** COPY-S1 B1–B2 + C + E1 / ONBOARDING-EDGE-COPY / PRE-CODE-LOCKS. EN-first. */
export const ONBOARDING_COPY = {
  headline: "Nova just woke up.",
  body: [
    "You're an Architect in-game — not Circle's official program.",
    "Each day, cast Influence on three choices.",
    "The crowd writes her story.",
    "Free Influence is yours every day; Extra Influence is optional (USDC).",
  ],
  connectCta: "Connect wallet",
  continueCta: "Continue",
  disclaimer:
    "I understand this is a third-party game on Arc. Rewards aren't guaranteed. Geo rules may apply. Not affiliated with Circle's Architects program. Not financial advice.",
  checkbox: "I accept the rules above",
  footerMicro: "Third-party on Arc · Not Circle Architects",
  feePool:
    "90% of Extra purchases go to that day's prize pool; 10% is the platform service fee.",
  feeRisk: "No guaranteed reward. Soft launch geo may apply.",
  feeAffiliation:
    "Third-party game on Arc. Not affiliated with Circle's Architects program.",
  grantTitle: "+10 Free Influence",
  grantBody: "Yours for today. Unused Free burns when the day ends.",
  grantFirstDay: "Use it on today's three choices. You can skip Extra.",
  tutorialTitle: "How today works",
  tutorialSteps: [
    "Goal of the day: MOST, LEAST, or MIDDLE — match the crowd's Influence.",
    "Free Influence is daily and free. Extra Influence (USDC) grows your paid-pool share if you're correct — it doesn't buy a better pick.",
    "Tap Cast Influence to lock your vote until results.",
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

export const GRANT_TOAST_MS = 4000;
