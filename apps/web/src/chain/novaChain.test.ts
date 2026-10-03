import { describe, expect, it } from "vitest";
import { ContractFunctionRevertedError, UserRejectedRequestError } from "viem";
import { chainErrorMessage } from "./chainErrors";
import { EMPTY_ENTRY, resultsDayFor, shareFor } from "./novaChain";
import { NOVA_POOL_ABI } from "./poolAbi";

const BUCKETS = {
  winnerId: "B" as const,
  paidBucket: 9_000_000n,
  freeBucket: 1_000_000n,
  freeTotals: { A: 0, B: 30, C: 0 },
  extraTotals: { A: 0, B: 150, C: 0 },
};

describe("pool share math (mirrors NovaDemoPool.claimable)", () => {
  it("pays both lanes pro rata with Extra capped at 100", () => {
    const share = shareFor({
      ...BUCKETS,
      entry: { ...EMPTY_ENTRY, voted: true, option: "B", free: 10, extraPlaced: 110 },
    });
    expect(share).toEqual({ paid: 6_000_000n, free: 333_333n, total: 6_333_333n });
  });

  it("pays nothing for a miss or a wallet that did not vote", () => {
    expect(shareFor({ ...BUCKETS, entry: { ...EMPTY_ENTRY, voted: true, option: "A", free: 10 } }).total).toBe(0n);
    expect(shareFor({ ...BUCKETS, entry: EMPTY_ENTRY }).total).toBe(0n);
  });

  it("reads today's results once settled, otherwise yesterday's", () => {
    expect(resultsDayFor({ dayId: 3, open: true })).toBe(2);
    expect(resultsDayFor({ dayId: 3, open: false })).toBe(3);
    expect(resultsDayFor({ dayId: 1, open: true })).toBe(0);
  });
});

describe("chain error copy", () => {
  it("names pool reverts in player language", () => {
    const revert = new ContractFunctionRevertedError({
      abi: NOVA_POOL_ABI,
      functionName: "castVote",
      data: "0x7c9a1cf9",
    });
    expect(revert.data?.errorName).toBe("AlreadyVoted");
    expect(chainErrorMessage(revert, "fallback")).toBe("This wallet has already voted today.");
  });

  it("treats a wallet rejection as a rejection, not a failure", () => {
    const rejected = new UserRejectedRequestError(new Error("User denied"));
    expect(chainErrorMessage(rejected, "fallback")).toBe("Request rejected in your wallet.");
    expect(chainErrorMessage({ code: 4001 }, "fallback")).toBe("Request rejected in your wallet.");
    expect(chainErrorMessage("??", "fallback")).toBe("fallback");
  });
});
