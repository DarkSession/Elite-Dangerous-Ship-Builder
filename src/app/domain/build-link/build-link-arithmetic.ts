import { BuildLinkCodecError } from './build-link-codec-error';

const STATE_BITS = 64n;
const FULL_RANGE = 1n << STATE_BITS;
const MAX_CODE = FULL_RANGE - 1n;
const HALF = FULL_RANGE >> 1n;
const QUARTER = HALF >> 1n;
const THREE_QUARTERS = QUARTER * 3n;

/** Integer arithmetic encoder with deterministic E1/E2/E3 termination. */
export class ArithmeticEncoder {
  private low = 0n;
  private high = MAX_CODE;
  private pendingUnderflow = 0;

  constructor(private readonly emitBit: (bit: number) => void) {}

  write(value: number, valueCount: number): void {
    validateSymbol(value, valueCount);
    const symbol = BigInt(value);
    const total = BigInt(valueCount);
    this.narrow(symbol, symbol + 1n, total);
  }

  /**
   * Encode `value` against a pinned non-uniform model. `cumulative` holds the model's cumulative
   * integer frequencies: `cumulative[s]` to `cumulative[s + 1]` is symbol `s`'s share of
   * `cumulative.at(-1)`. The table that pins the weights is what keeps this canonical.
   */
  writeWeighted(value: number, cumulative: readonly number[]): void {
    validateSymbol(value, cumulative.length - 1);
    const interval = validateInterval(cumulative[value]!, cumulative[value + 1]!, cumulative);
    this.narrow(...interval);
  }

  private narrow(cumulativeLow: bigint, cumulativeHigh: bigint, total: bigint): void {
    const range = this.high - this.low + 1n;
    const previousLow = this.low;
    this.high = previousLow + (range * cumulativeHigh) / total - 1n;
    this.low = previousLow + (range * cumulativeLow) / total;
    this.renormalise();
  }

  finish(): void {
    this.pendingUnderflow += 1;
    if (this.low < QUARTER) this.emitWithUnderflow(0);
    else this.emitWithUnderflow(1);
  }

  private renormalise(): void {
    for (;;) {
      if (this.high < HALF) {
        this.emitWithUnderflow(0);
      } else if (this.low >= HALF) {
        this.emitWithUnderflow(1);
        this.low -= HALF;
        this.high -= HALF;
      } else if (this.low >= QUARTER && this.high < THREE_QUARTERS) {
        this.pendingUnderflow += 1;
        this.low -= QUARTER;
        this.high -= QUARTER;
      } else {
        return;
      }
      this.low <<= 1n;
      this.high = (this.high << 1n) + 1n;
    }
  }

  private emitWithUnderflow(bit: 0 | 1): void {
    this.emitBit(bit);
    while (this.pendingUnderflow > 0) {
      this.emitBit(bit ^ 1);
      this.pendingUnderflow -= 1;
    }
  }
}

/** Matching arithmetic decoder. Missing termination bits are defined as zero. */
export class ArithmeticDecoder {
  private low = 0n;
  private high = MAX_CODE;
  private code = 0n;

  constructor(private readonly readBitOrZero: () => number) {
    for (let bit = 0n; bit < STATE_BITS; bit += 1n) {
      this.code = (this.code << 1n) | BigInt(this.readBitOrZero());
    }
  }

  read(valueCount: number): number {
    validateValueCount(valueCount);
    const total = BigInt(valueCount);
    const symbol = this.target(total);
    this.widenAndRenormalise(symbol, symbol + 1n, total);
    return Number(symbol);
  }

  /** Decode a symbol against the same pinned cumulative frequencies the encoder used. */
  readWeighted(cumulative: readonly number[]): number {
    validateValueCount(cumulative.length - 1);
    if (!Number.isSafeInteger(cumulative.at(-1))) {
      throw new BuildLinkCodecError('invalidPayload', 'An arithmetic-coded range is invalid.');
    }
    const total = BigInt(cumulative.at(-1)!);
    const target = this.target(total);
    let lowIndex = 0;
    let highIndex = cumulative.length - 1;
    while (highIndex - lowIndex > 1) {
      const middle = (lowIndex + highIndex) >> 1;
      const middleValue = cumulative[middle]!;
      if (!Number.isSafeInteger(middleValue)) {
        throw new BuildLinkCodecError('invalidPayload', 'An arithmetic-coded range is invalid.');
      }
      if (BigInt(middleValue) <= target) lowIndex = middle;
      else highIndex = middle;
    }
    const interval = validateInterval(cumulative[lowIndex]!, cumulative[lowIndex + 1]!, cumulative);
    this.widenAndRenormalise(...interval);
    return lowIndex;
  }

  private target(total: bigint): bigint {
    const range = this.high - this.low + 1n;
    const target = ((this.code - this.low + 1n) * total - 1n) / range;
    if (target < 0n || target >= total) {
      throw new BuildLinkCodecError('invalidPayload', 'An arithmetic-coded integer is invalid.');
    }
    return target;
  }

  private widenAndRenormalise(cumulativeLow: bigint, cumulativeHigh: bigint, total: bigint): void {
    const range = this.high - this.low + 1n;
    const previousLow = this.low;
    this.high = previousLow + (range * cumulativeHigh) / total - 1n;
    this.low = previousLow + (range * cumulativeLow) / total;
    this.renormalise();
  }

  private renormalise(): void {
    for (;;) {
      if (this.high < HALF) {
        // No offset adjustment.
      } else if (this.low >= HALF) {
        this.low -= HALF;
        this.high -= HALF;
        this.code -= HALF;
      } else if (this.low >= QUARTER && this.high < THREE_QUARTERS) {
        this.low -= QUARTER;
        this.high -= QUARTER;
        this.code -= QUARTER;
      } else {
        return;
      }
      this.low <<= 1n;
      this.high = (this.high << 1n) + 1n;
      this.code = (this.code << 1n) | BigInt(this.readBitOrZero());
    }
  }
}

function validateSymbol(value: number, valueCount: number): void {
  validateValueCount(valueCount);
  if (!Number.isSafeInteger(value) || value < 0 || value >= valueCount) {
    throw new BuildLinkCodecError('invalidPayload', 'An arithmetic-coded integer is invalid.');
  }
}

function validateValueCount(valueCount: number): void {
  if (!Number.isSafeInteger(valueCount) || valueCount < 2) {
    throw new BuildLinkCodecError('invalidPayload', 'An arithmetic-coded range is invalid.');
  }
}

/**
 * Guard the entries a weighted symbol actually uses so that a malformed cumulative table fails
 * with this module's typed error instead of corrupting the interval silently.
 */
function validateInterval(
  cumulativeLow: number,
  cumulativeHigh: number,
  cumulative: readonly number[],
): [bigint, bigint, bigint] {
  const total = cumulative.at(-1)!;
  if (
    !Number.isSafeInteger(cumulativeLow) ||
    !Number.isSafeInteger(cumulativeHigh) ||
    !Number.isSafeInteger(total) ||
    cumulativeLow < 0 ||
    cumulativeLow >= cumulativeHigh ||
    cumulativeHigh > total
  ) {
    throw new BuildLinkCodecError('invalidPayload', 'An arithmetic-coded range is invalid.');
  }
  return [BigInt(cumulativeLow), BigInt(cumulativeHigh), BigInt(total)];
}
