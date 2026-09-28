/** Selectors from `cast sig`. Return types do not change the selector. */
export const APPROVE_SELECTOR = "0x095ea7b3";
export const BUY_EXTRA_INFLUENCE_SELECTOR = "0x6b6daf59";
export const SNAPSHOT_SELECTOR = "0x9711715a";

export const PACK_ON_CHAIN = {
  spark: 1,
  pulse: 2,
} as const;

export function encodeUint256(value: bigint): string {
  if (value < 0n) {
    throw new RangeError("uint256 cannot be negative");
  }
  return value.toString(16).padStart(64, "0");
}

export function encodeAddress(address: string): string {
  const hex = address.toLowerCase().replace(/^0x/, "");
  if (!/^[a-f0-9]{40}$/.test(hex)) {
    throw new RangeError(`Invalid address: ${address}`);
  }
  return hex.padStart(64, "0");
}

export function encodeApprove(spender: string, amount: bigint): string {
  return APPROVE_SELECTOR + encodeAddress(spender) + encodeUint256(amount);
}

export function encodeBuy(packId: number): string {
  return BUY_EXTRA_INFLUENCE_SELECTOR + encodeUint256(BigInt(packId));
}

export function decodeWords(data: string): bigint[] {
  const hex = data.startsWith("0x") ? data.slice(2) : data;
  const words: bigint[] = [];
  for (let index = 0; index + 64 <= hex.length; index += 64) {
    words.push(BigInt(`0x${hex.slice(index, index + 64)}`));
  }
  return words;
}

export type PoolSnapshot = {
  gross: bigint;
  prize: bigint;
  studioNet: bigint;
  novaBudget: bigint;
  dayId: bigint;
  dayOpen: boolean;
  settled: boolean;
  settledNovaBudget: bigint;
  novaBudgetSpent: bigint;
};

export type SignalSnapshot = {
  wallet: string;
  cap: bigint;
  signaled: bigint;
  remainingCap: bigint;
};

function wordToAddress(word: bigint): string {
  return `0x${word.toString(16).padStart(40, "0").slice(-40)}`;
}

export function decodePoolSnapshot(data: string): PoolSnapshot | null {
  const words = decodeWords(data);
  if (words.length < 9) return null;
  return {
    gross: words[0] ?? 0n,
    prize: words[1] ?? 0n,
    studioNet: words[2] ?? 0n,
    novaBudget: words[3] ?? 0n,
    dayId: words[4] ?? 0n,
    dayOpen: (words[5] ?? 0n) !== 0n,
    settled: (words[6] ?? 0n) !== 0n,
    settledNovaBudget: words[7] ?? 0n,
    novaBudgetSpent: words[8] ?? 0n,
  };
}

export function decodeSignalSnapshot(data: string): SignalSnapshot | null {
  const words = decodeWords(data);
  if (words.length < 4) return null;
  return {
    wallet: wordToAddress(words[0] ?? 0n),
    cap: words[1] ?? 0n,
    signaled: words[2] ?? 0n,
    remainingCap: words[3] ?? 0n,
  };
}
