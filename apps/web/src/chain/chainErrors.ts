import { BaseError, ContractFunctionRevertedError, UserRejectedRequestError } from "viem";

const REVERT_COPY: Record<string, string> = {
  DailyCapExceeded: "That pack would pass today's 10 USDC limit.",
  DayNotOpen: "Today's round is closed. Results come after the day settles.",
  VotingClosed: "Voting has closed for today.",
  AlreadyVoted: "This wallet has already voted today.",
  FreeExceeded: "You only have 10 Free Influence today.",
  ExtraExceeded: "You can't place more Extra than you bought today.",
  UnknownOption: "Pick A, B or C.",
  UnknownPack: "Unknown pack.",
  ZeroAmount: "Place at least 1 Influence.",
  AlreadyClaimed: "This payout was already claimed.",
  NothingToClaim: "There is nothing to claim for this day.",
  TransferFailed: "The USDC transfer failed. Check your balance and try again.",
};

/** Wallet and contract errors → one short line for the HUD. */
export function chainErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof BaseError) {
    if (error.walk((cause) => cause instanceof UserRejectedRequestError)) {
      return "Request rejected in your wallet.";
    }
    const revert = error.walk((cause) => cause instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) {
      const name = revert.data?.errorName;
      if (name && REVERT_COPY[name]) return REVERT_COPY[name];
    }
    return error.shortMessage || fallback;
  }
  if (typeof error === "object" && error && "code" in error && (error as { code: unknown }).code === 4001) {
    return "Request rejected in your wallet.";
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
