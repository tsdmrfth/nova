import {
  BPS_DENOMINATOR,
  DAY_GOALS,
  DAY_SPLIT_BPS,
  EFFECTIVE_EXTRA_CAP,
  EFFECTIVE_FREE_CAP,
  FREE_DAILY_GRANT,
  MAX_DAILY_EXTRA_BUY_MICRO,
  MICRO_USDC_PER_USDC,
  NOVA_BUDGET_LABEL,
  PLATFORM_FEE_LABEL,
  PULSE_PACK,
  SPARK_PACK,
  allocateProRata,
  buySplitPercents,
  formatUsdc,
  pickWinningOption,
  splitGrossBuy,
  type DayGoal,
} from "@nova/shared";

const buy = buySplitPercents();
const lanePct = {
  paid: DAY_SPLIT_BPS.paidWinners / (BPS_DENOMINATOR / 100),
  free: DAY_SPLIT_BPS.freeWinners / (BPS_DENOMINATOR / 100),
};
const spark = splitGrossBuy(SPARK_PACK.priceMicroUsdc);
const usdc = (micro: bigint) => `${formatUsdc(micro)} USDC`;
const capitalized = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
/** Two decimals for the worked example; the real payout keeps all six. */
const approx = (micro: bigint) => (Number(micro) / Number(MICRO_USDC_PER_USDC)).toFixed(2);

/** Made-up Free Influence totals for the goal example; the winner comes from the real rule. */
const EXAMPLE_VOTES = [
  { id: "A", votes: 480 },
  { id: "B", votes: 310 },
  { id: "C", votes: 210 },
] as const;

function exampleWinner(goal: DayGoal): string {
  return pickWinningOption({
    goal,
    optionIds: EXAMPLE_VOTES.map((row) => row.id),
    casts: EXAMPLE_VOTES.map((row) => ({ optionId: row.id, free: row.votes })),
  });
}

/** Worked share example: a 1 USDC free lane, two winners with 10 and 5 Free, via the real allocator. */
const SHARE_EXAMPLE = (() => {
  const lane = MICRO_USDC_PER_USDC;
  const winners = [
    { walletId: "you", label: "You", weight: 10 },
    { walletId: "other", label: "Another winner", weight: 5 },
  ];
  const { shares } = allocateProRata(lane, winners);
  return {
    lane: usdc(lane),
    winners: winners.map((winner) => ({
      label: winner.label,
      free: winner.weight,
      payout: `≈ ${approx(shares.find((share) => share.walletId === winner.walletId)?.payout ?? 0n)} USDC`,
    })),
  };
})();

const GOAL_RULES: Record<DayGoal, string> = {
  MOST: "The choice with the most votes wins.",
  LEAST: "The choice with the fewest votes wins.",
  MIDDLE: "The choice in second place wins.",
};

export type GuideChapterId = "day" | "goal" | "extra" | "pool" | "nova";

/**
 * Menu › Help › How Nova works: the whole game end to end, in plain words.
 * Every number comes from @nova/shared, so the guide can't drift from the rules.
 */
export const GUIDE_COPY = {
  backLabel: "Guide",
  title: "How Nova works",
  sub: "Everything about a day in Nova, from your first vote to the prize.",
  timelineLabel: "A day in Nova",
  timeline: [
    { id: "open", when: "00:00", label: "Chapter opens" },
    { id: "vote", when: "All day", label: "You vote" },
    { id: "close", when: "Close", label: "Voting closes" },
    { id: "results", when: "After", label: "Results and claim" },
  ],
  jumpLabel: "Jump to",
  chapters: [
    { id: "day", jump: "The day" },
    { id: "goal", jump: "What wins" },
    { id: "extra", jump: "Extra" },
    { id: "pool", jump: "Prize pool" },
    { id: "nova", jump: "Nova's share" },
  ] satisfies readonly { id: GuideChapterId; jump: string }[],

  day: {
    kicker: "01 · The day",
    title: "A new chapter every day",
    body: "Each day Nova faces one decision with three paths. Players vote, and the winning path becomes Nova's story.",
    paths: ["A", "B", "C"],
    pathLabel: "Path",
    votesTitle: "Your daily votes",
    votesBody: `You get ${FREE_DAILY_GRANT} Free Influence every day, at no cost. Each one is a vote.`,
    votes: FREE_DAILY_GRANT,
    votesUnit: "Free Influence",
    facts: [
      "Put your votes on one choice.",
      "Your vote locks once cast. You can't change it later.",
      "Unused Free Influence is gone at the end of the day.",
    ],
  },

  goal: {
    kicker: "02 · What wins",
    title: "Every day has a goal",
    body: "The goal is shown as GOAL at the top of Home. It tells you which choice wins. Tap one to see it:",
    goals: DAY_GOALS,
    rules: GOAL_RULES,
    todayTag: "Today",
    winnerTag: "WINNER",
    exampleLabel: "Example: Free Influence from all players",
    example: EXAMPLE_VOTES,
    exampleWinner,
    guessTitle: "You're guessing the crowd",
    guessBody:
      "Only Free Influence counts toward the winner, and everyone gets the same amount. So you're guessing what other players will do, not picking your favorite path.",
    tie: "If two choices tie, the earlier letter ranks higher (A before B).",
  },

  extra: {
    kicker: "03 · Extra Influence",
    title: "Want a bigger share?",
    body: "Extra Influence is optional. You buy it with USDC on Arc.",
    unit: "USDC",
    packs: [SPARK_PACK, PULSE_PACK].map((pack) => ({
      id: pack.id,
      name: pack.name,
      price: formatUsdc(pack.priceMicroUsdc),
      extra: `${pack.extraInfluence} Extra`,
    })),
    does: "Grows your share of the prize if your choice wins.",
    doesnt: "Never changes which choice wins.",
    caps: [
      `Up to ${usdc(MAX_DAILY_EXTRA_BUY_MICRO)} of Extra a day`,
      `Up to ${EFFECTIVE_EXTRA_CAP} Extra counts toward your share`,
    ],
  },

  pool: {
    kicker: "04 · The prize pool",
    title: "Where each USDC goes",
    buyLabel: `Buy ${SPARK_PACK.name}`,
    buyAmount: usdc(SPARK_PACK.priceMicroUsdc),
    split: [
      { id: "pool", pct: buy.prizePool, label: "Today's prize pool", amount: usdc(spark.prizePool) },
      { id: "studio", pct: buy.studioNet, label: capitalized(PLATFORM_FEE_LABEL), amount: usdc(spark.studioNet) },
      { id: "nova", pct: buy.novaBudget, label: NOVA_BUDGET_LABEL, amount: usdc(spark.novaBudget) },
    ],
    splitNote: `The ${PLATFORM_FEE_LABEL} goes to the studio that makes Nova.`,
    poolTitle: "Today's prize pool",
    poolBody: `${buy.prizePool}% of every Extra buy today, plus anything rolled over from earlier days. Free Influence is free, so it adds nothing. Losing votes don't get their USDC back; it stays in the pool for the winners.`,
    lanesLabel: "Winners share it in two lanes",
    lanes: [
      { id: "paid", pct: `${lanePct.paid}%`, title: "Paid lane", text: "For winners who put Extra on the winning choice." },
      { id: "free", pct: `${lanePct.free}%`, title: "Free lane", text: "For winners who put Free on the winning choice." },
    ],
    shareTitle: "Your share",
    shareBody: `In each lane, winners split by how much Influence they put on the winning choice. Up to ${EFFECTIVE_FREE_CAP} Free and ${EFFECTIVE_EXTRA_CAP} Extra count. Used both? You get a share from both lanes.`,
    shareExampleLabel: `Example: a free lane of ${SHARE_EXAMPLE.lane}`,
    shareExample: SHARE_EXAMPLE.winners,
    shareMax: EFFECTIVE_FREE_CAP,
    shareUnit: "Free",
    rollover:
      "No winners in a lane? Its share rolls over to tomorrow's pool. On a day with no Extra buys and no rollover, the pool is zero, and winners get nothing in USDC.",
    claimTitle: "Getting paid",
    claimBody: "After voting closes, Results shows the winning choice and your share. Tap Claim to send it to your connected wallet on Arc.",
  },

  nova: {
    kicker: "05 · Nova's share",
    title: "Nova has its own wallet",
    orb: `${buy.novaBudget}%`,
    body: `Nova is a scripted AI agent with its own public wallet on Arc. ${buy.novaBudget}% of every Extra buy goes to the ${NOVA_BUDGET_LABEL}.`,
    facts: [
      "After a day settles, Nova's agent can send USDC from that budget to Nova's public wallet.",
      "Anyone can see it on chain.",
      "It has a hard limit, and it can never touch the prize pool.",
    ],
  },

  finePrintTitle: "Good to know",
  finePrint: [
    "Nova is a story game. Nova is a scripted AI agent, not general intelligence.",
    "Payouts come only from each day's pool and can be zero. There's no guaranteed return. Contracts are new. Not financial advice.",
    "Nova runs on Arc and is not affiliated with or endorsed by Circle or its Architects program. Soft launch geo rules may apply.",
  ],
} as const;
