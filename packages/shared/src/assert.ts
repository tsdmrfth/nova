export function assertNonNegativeInt(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer`);
  }
}

export function assertNonNegativeMicro(value: bigint, label: string): void {
  if (value < 0n) {
    throw new RangeError(`${label} must be a non-negative micro-USDC amount`);
  }
}
