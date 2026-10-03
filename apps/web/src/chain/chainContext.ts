import { createContext, useContext } from "react";
import type { NovaChain } from "./novaChain";

/** Null when the pool address is not configured for this build. */
export const NovaChainContext = createContext<NovaChain | null>(null);

export function useNovaChain(): NovaChain | null {
  return useContext(NovaChainContext);
}
