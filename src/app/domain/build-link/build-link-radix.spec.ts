import { BuildLinkCodecError } from './build-link-codec-error';
import {
  BUILD_LINK_ALPHABET,
  BUILD_LINK_FINAL_ALPHABET,
  decodeBuildLinkPayload,
  encodeBuildLinkPayload,
} from './build-link-radix';

describe('build-link Base73 encoding', () => {
  it('round-trips arbitrary bytes, including leading zero bytes', () => {
    const samples = [
      new Uint8Array(),
      new Uint8Array([0]),
      new Uint8Array([0, 0, 1]),
      new Uint8Array([255, 0, 127, 64, 1]),
      Uint8Array.from({ length: 256 }, (_, index) => (index * 73 + 19) & 0xff),
    ];
    for (const sample of samples) {
      const encoded = encodeBuildLinkPayload(sample);
      expect(decodeBuildLinkPayload(encoded)).toEqual(sample);
      if (encoded.length > 0) expect(BUILD_LINK_FINAL_ALPHABET).toContain(encoded.at(-1));
    }
  });

  it('uses the selected unique alphabets and survives browser URL parsing', () => {
    expect(BUILD_LINK_ALPHABET).toHaveLength(73);
    expect(new Set(BUILD_LINK_ALPHABET)).toHaveProperty('size', 73);
    expect(BUILD_LINK_FINAL_ALPHABET).toHaveLength(62);
    const fragment = `b.${BUILD_LINK_ALPHABET}`;
    expect(new URL(`https://ships.example/#${fragment}`).hash.slice(1)).toBe(fragment);
  });

  it('rejects invalid characters and unsafe terminal digits', () => {
    for (const encoded of ['%', '1!']) {
      expect(() => decodeBuildLinkPayload(encoded)).toThrowError(BuildLinkCodecError);
    }
  });
});
