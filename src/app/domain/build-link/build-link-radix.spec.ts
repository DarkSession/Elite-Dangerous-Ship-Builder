import { BuildLinkCodecError } from './build-link-codec-error';
import {
  BUILD_LINK_ALPHABET,
  BUILD_LINK_FINAL_ALPHABET,
  decodeBuildLinkPayload,
  encodeBuildLinkPayload,
} from './build-link-radix';

describe('build-link Base69 encoding', () => {
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
    expect(encodeBuildLinkPayload(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]))).toBe('2JL5irt2Qc');
    expect(encodeBuildLinkPayload(Uint8Array.from({ length: 256 }, (_, index) => index))).toBe(
      '0HdnS8ef:jOS6Y9lUd$DKsDV7F0dlft$QZM9Sm$KGSwmkGX/2-Q17VXWC!mdx/1i4Z9B9Uz8dp@Vb/p2fcJVjX8Z-b!hPKf3ePhwf/9/f62!2wm0J1sYl:hi6J9H3pSKj9Ug7CAxj95j68xFqZAfRAjnwsYcui4vNq23/9FXZxp4Mk.e96ppFtj-qMHqSH3G/dXEr-YMVc8mA6ECsGyRok!x-080HeI/T2uPsTOS1jAeSwP:VYyMd7Y-kskjpX9ik.TdN.BXAUj:UosEIw1GSTrFIfBM0E9qDGnnpVSMMn.!QqM9PUiHFggbr/2d/DohB-V6O7Oj5DnNVz',
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
    expect(BUILD_LINK_ALPHABET).toHaveLength(69);
    expect(new Set(BUILD_LINK_ALPHABET)).toHaveProperty('size', 69);
    expect(BUILD_LINK_FINAL_ALPHABET).toHaveLength(62);
    for (const rendererSensitive of ['*', '_', '~', '+']) {
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
    encoded = BUILD_LINK_ALPHABET[Number(value % 69n)]! + encoded;
    value /= 69n;
  }
  return BUILD_LINK_ALPHABET[0]!.repeat(leadingZeros) + encoded;
}
