import { BuildLinkCodecError } from './build-link-codec-error';
import {
  BUILD_LINK_ALPHABET,
  BUILD_LINK_FINAL_ALPHABET,
  decodeBuildLinkPayload,
  encodeBuildLinkPayload,
} from './build-link-radix';

describe('build-link Base70 encoding', () => {
  it('round-trips arbitrary bytes, including leading zero bytes', () => {
    const samples = [
      new Uint8Array(),
      new Uint8Array([0]),
      new Uint8Array([0, 0, 1]),
      new Uint8Array([255, 0, 127, 64, 1]),
      Uint8Array.from({ length: 256 }, (_, index) => (index * 73 + 19) & 0xff),
      Uint8Array.from({ length: 512 }, (_, index) => (index * 251 + 113) & 0xff),
    ];
    for (const sample of samples) {
      const encoded = encodeBuildLinkPayload(sample);
      expect(decodeBuildLinkPayload(encoded)).toEqual(sample);
      if (encoded.length > 0) expect(BUILD_LINK_FINAL_ALPHABET).toContain(encoded.at(-1));
    }
  });

  it('keeps the published mixed-radix spellings without whole-payload BigInts', () => {
    expect(encodeBuildLinkPayload(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]))).toBe('22GNJzAV,c');
    expect(encodeBuildLinkPayload(Uint8Array.from({ length: 256 }, (_, index) => index))).toBe(
      '0AZnQ9di,PX,PEmUrmSbI1cm0aT/0qS-m2tbNj4kBbdgPRIXJaMy:yigSf3obJh2o-xtOjU_M!Nf.DTJ7WJKl@4@ykK1chg-LIbYSfJCK7M_qMkw.Kj.uKcCo@kj@Ua5OQK@Z5N5aV6PKVJoZsrqXS,G.82N9c_bOyueC3rr!5!b9/s6eCpik1Of0l:dLi/dGH6MtKHTaBXWJNWwbRBqJI_Ar4048Se!JtB5EF3h/F9jR/iwTNYJxHV9.W.9j!igM059E2xPd2fWJfABiRPvJAqJ@HOfyTQWjU6BEQWyqzJsidz70Ff@ZMyf-7sFuhvUNn97qRP:ypCRz',
    );
  });

  it('matches the original whole-value conversion across bounded and irregular payloads', () => {
    for (const length of [0, 1, 2, 3, 7, 8, 31, 64, 127, 256, 500]) {
      const bytes = Uint8Array.from(
        { length },
        (_, index) => (index * 197 + length * 29 + (index % 7) * 11) & 0xff,
      );
      expect(encodeBuildLinkPayload(bytes)).toBe(legacyEncodeBuildLinkPayload(bytes));
    }
  });

  it('uses the selected unique alphabets and survives browser URL parsing', () => {
    expect(BUILD_LINK_ALPHABET).toHaveLength(70);
    expect(new Set(BUILD_LINK_ALPHABET)).toHaveProperty('size', 70);
    expect(BUILD_LINK_FINAL_ALPHABET).toHaveLength(62);
    expect(BUILD_LINK_ALPHABET).toContain('_');
    expect(BUILD_LINK_ALPHABET).toContain(',');
    for (const rendererSensitive of ['$', '*', '~', '+']) {
      expect(BUILD_LINK_ALPHABET).not.toContain(rendererSensitive);
    }
    const fragment = `b.${BUILD_LINK_ALPHABET}`;
    expect(new URL(`https://ships.example/#${fragment}`).hash.slice(1)).toBe(fragment);
  });

  it('rejects invalid characters and unsafe terminal digits', () => {
    for (const encoded of ['%', '1!']) {
      expect(() => decodeBuildLinkPayload(encoded)).toThrowError(BuildLinkCodecError);
    }
  });
});

function legacyEncodeBuildLinkPayload(bytes: Uint8Array): string {
  if (bytes.length === 0) return '';
  let leadingZeros = 0;
  while (leadingZeros < bytes.length && bytes[leadingZeros] === 0) leadingZeros += 1;
  let value = 0n;
  for (const byte of bytes) value = (value << 8n) | BigInt(byte);
  if (value === 0n) return BUILD_LINK_ALPHABET[0]!.repeat(leadingZeros);

  let encoded = BUILD_LINK_FINAL_ALPHABET[Number(value % 62n)]!;
  value /= 62n;
  while (value > 0n) {
    encoded = BUILD_LINK_ALPHABET[Number(value % 70n)]! + encoded;
    value /= 70n;
  }
  return BUILD_LINK_ALPHABET[0]!.repeat(leadingZeros) + encoded;
}
