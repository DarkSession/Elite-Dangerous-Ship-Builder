import { ArithmeticDecoder, ArithmeticEncoder } from './build-link-arithmetic';
import { BuildLinkCodecError } from './build-link-codec-error';

describe('build-link arithmetic coding', () => {
  it('pins deterministic mixed-radix and large-rank vectors', () => {
    expect(encode([{ value: 0, count: 2 }])).toBe('001');
    expect(
      encode([
        { value: 2, count: 3 },
        { value: 4, count: 5 },
        { value: 63, count: 64 },
        { value: 255, count: 256 },
      ]),
    ).toBe('1111111111111111110');
    expect(encode([{ value: 35_000_000_000, count: 35_345_263_800 }])).toBe(
      '111111010111111111010010110011101101',
    );
  });

  it('round-trips every short sequence over small non-power-of-two alphabets', () => {
    for (const count of [3, 5]) {
      for (let length = 1; length <= 5; length += 1) {
        const sequenceCount = count ** length;
        for (let packed = 0; packed < sequenceCount; packed += 1) {
          let remaining = packed;
          const symbols = Array.from({ length }, () => {
            const value = remaining % count;
            remaining = Math.floor(remaining / count);
            return { value, count };
          });
          expect(
            decode(
              encode(symbols),
              symbols.map(({ count: radix }) => radix),
            ),
          ).toEqual(symbols.map(({ value }) => value));
        }
      }
    }
  });

  it('uses implicit zero extension for compact deterministic termination', () => {
    const bits = encode([
      { value: 0, count: 3 },
      { value: 1, count: 3 },
      { value: 2, count: 3 },
    ]);

    expect(bits.length).toBeLessThan(64);
    expect(decode(bits, [3, 3, 3])).toEqual([0, 1, 2]);
  });

  it('rejects invalid symbols and ranges', () => {
    const encoder = new ArithmeticEncoder(() => undefined);
    expect(() => encoder.write(-1, 3)).toThrowError(BuildLinkCodecError);
    expect(() => encoder.write(3, 3)).toThrowError(BuildLinkCodecError);
    expect(() => encoder.write(0, 1)).toThrowError(BuildLinkCodecError);
    const decoder = new ArithmeticDecoder(() => 0);
    expect(() => decoder.read(1)).toThrowError(BuildLinkCodecError);
  });
});

type Symbol = { readonly value: number; readonly count: number };

function encode(symbols: readonly Symbol[]): string {
  const bits: number[] = [];
  const encoder = new ArithmeticEncoder((bit) => bits.push(bit));
  symbols.forEach(({ value, count }) => encoder.write(value, count));
  encoder.finish();
  return bits.join('');
}

function decode(bits: string, counts: readonly number[]): number[] {
  let offset = 0;
  const decoder = new ArithmeticDecoder(() => Number(bits[offset++] ?? 0));
  return counts.map((count) => decoder.read(count));
}
