import type { DemoConfig } from "../demo/demoConfig";
import type { NovaChain } from "./novaChain";

/**
 * Same client as `createArcChain`, but viem loads in its own chunk on the first
 * pool read, so the game shell paints before it arrives.
 */
export function lazyArcChain(config: DemoConfig): NovaChain | null {
  if (!config.poolAddress) return null;
  let loaded: Promise<NovaChain> | null = null;
  const load = () => {
    loaded ??= import("./arcChain").then(({ createArcChain }) => {
      const chain = createArcChain(config);
      if (!chain) throw new Error("Pool address is not set.");
      return chain;
    });
    return loaded;
  };
  return {
    chainName: config.chainName,
    explorerUrl: config.explorerUrl,
    readDay: async (account) => (await load()).readDay(account),
    readResult: async (dayId, account) => (await load()).readResult(dayId, account),
    readWinners: async (throughDay) => (await load()).readWinners(throughDay),
    buy: async (account, pack) => (await load()).buy(account, pack),
    castVote: async (account, option, free, extra) => (await load()).castVote(account, option, free, extra),
    claim: async (account, dayId) => (await load()).claim(account, dayId),
  };
}
