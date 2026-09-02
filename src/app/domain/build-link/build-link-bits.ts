import { BuildLinkCodecError } from './build-link-codec-error';

/**
 * Bit packing for a codec body, shared by every link this application publishes.
 *
 * A width-bounded integer written little-endian inside each byte. It is the
 * floor both codecs build on: the ship builder's canonical form packs its own
 * fields this way before the arithmetic coder takes over, and the equipment
 * builder's loadout is small enough that packing is the whole of it.
 */
export class RawBitWriter {
  private readonly bytes: number[] = [];
  private bitLength = 0;

  writeBoolean(value: boolean): void {
    this.writeBits(value ? 1 : 0, 1);
  }

  writeBits(value: number, width: number): void {
    if (
      !Number.isSafeInteger(value) ||
      value < 0 ||
      !Number.isInteger(width) ||
      width < 1 ||
      width > 31 ||
      value >= 2 ** width
    ) {
      throw new BuildLinkCodecError('invalidPayload', 'A bit-packed integer is invalid.');
    }
    for (let bit = 0; bit < width; bit += 1) {
      const byteIndex = Math.floor(this.bitLength / 8);
      const bitIndex = this.bitLength % 8;
      this.bytes[byteIndex] ??= 0;
      if (Math.floor(value / 2 ** bit) % 2 === 1) this.bytes[byteIndex] |= 1 << bitIndex;
      this.bitLength += 1;
    }
  }

  toUint8Array(): Uint8Array {
    return Uint8Array.from(this.bytes);
  }
}

export class RawBitReader {
  private bitOffset = 0;

  constructor(private readonly bytes: Uint8Array) {}

  get done(): boolean {
    const remaining = this.bytes.length * 8 - this.bitOffset;
    if (remaining >= 8) return false;
    for (let offset = this.bitOffset; offset < this.bytes.length * 8; offset += 1) {
      const byte = this.bytes[Math.floor(offset / 8)]!;
      if ((byte & (1 << (offset % 8))) !== 0) return false;
    }
    return true;
  }

  readBoolean(): boolean {
    return this.readBits(1) === 1;
  }

  readBitOrZero(): number {
    if (this.bitOffset >= this.bytes.length * 8) return 0;
    return this.readBits(1);
  }

  readBits(width: number): number {
    if (!Number.isInteger(width) || width < 1 || width > 31) {
      throw new BuildLinkCodecError('invalidPayload', 'A bit width is invalid.');
    }
    if (this.bitOffset + width > this.bytes.length * 8) {
      throw new BuildLinkCodecError('invalidPayload', 'The build-link payload is truncated.');
    }
    let value = 0;
    for (let bit = 0; bit < width; bit += 1) {
      const offset = this.bitOffset + bit;
      const byte = this.bytes[Math.floor(offset / 8)]!;
      if ((byte & (1 << (offset % 8))) !== 0) value += 2 ** bit;
    }
    this.bitOffset += width;
    return value;
  }
}
