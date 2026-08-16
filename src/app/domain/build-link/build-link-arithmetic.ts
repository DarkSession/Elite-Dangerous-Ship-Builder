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
    const range = this.high - this.low + 1n;
    const previousLow = this.low;
    this.high = previousLow + (range * (symbol + 1n)) / total - 1n;
    this.low = previousLow + (range * symbol) / total;
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
    const range = this.high - this.low + 1n;
    const symbol = ((this.code - this.low + 1n) * total - 1n) / range;
    if (symbol < 0n || symbol >= total) {
      throw new BuildLinkCodecError('invalidPayload', 'An arithmetic-coded integer is invalid.');
    }
    const previousLow = this.low;
    this.high = previousLow + (range * (symbol + 1n)) / total - 1n;
    this.low = previousLow + (range * symbol) / total;
    this.renormalise();
    return Number(symbol);
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
