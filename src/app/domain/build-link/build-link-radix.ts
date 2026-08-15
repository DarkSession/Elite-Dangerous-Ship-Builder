import { BuildLinkCodecError } from './build-link-codec-error';

export const BUILD_LINK_ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-.!$/:@';
export const BUILD_LINK_FINAL_ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/** Encode bytes as Base69 with a Base62 terminal digit safe for bare-link autolinkers. */
export function encodeBuildLinkPayload(bytes: Uint8Array): string {
  if (bytes.length === 0) return '';

  let leadingZeros = 0;
  while (leadingZeros < bytes.length && bytes[leadingZeros] === 0) leadingZeros += 1;
  let value = 0n;
  for (const byte of bytes) value = (value << 8n) | BigInt(byte);
  if (value === 0n) return BUILD_LINK_ALPHABET[0]!.repeat(leadingZeros);

  const finalRadix = BigInt(BUILD_LINK_FINAL_ALPHABET.length);
  let encoded = BUILD_LINK_FINAL_ALPHABET[Number(value % finalRadix)]!;
  value /= finalRadix;
  const radix = BigInt(BUILD_LINK_ALPHABET.length);
  while (value > 0n) {
    encoded = BUILD_LINK_ALPHABET[Number(value % radix)]! + encoded;
    value /= radix;
  }
  return BUILD_LINK_ALPHABET[0]!.repeat(leadingZeros) + encoded;
}

/** Decode canonical Base69/Base62-terminal text to its original bytes. */
export function decodeBuildLinkPayload(encoded: string): Uint8Array {
  if (encoded.length === 0) return new Uint8Array();

  let leadingZeros = 0;
  while (leadingZeros < encoded.length && encoded[leadingZeros] === BUILD_LINK_ALPHABET[0]) {
    leadingZeros += 1;
  }
  const body = encoded.slice(leadingZeros);
  const indexes = new Map([...BUILD_LINK_ALPHABET].map((character, index) => [character, index]));
  const radix = BigInt(BUILD_LINK_ALPHABET.length);
  let value = 0n;
  for (const character of body.slice(0, -1)) {
    const index = indexes.get(character);
    if (index === undefined) throw invalidEncoding();
    value = value * radix + BigInt(index);
  }
  if (body.length > 0) {
    const finalIndex = BUILD_LINK_FINAL_ALPHABET.indexOf(body.at(-1)!);
    if (finalIndex < 0) throw invalidEncoding();
    value = value * BigInt(BUILD_LINK_FINAL_ALPHABET.length) + BigInt(finalIndex);
  }

  const reversed: number[] = [];
  while (value > 0n) {
    reversed.push(Number(value & 0xffn));
    value >>= 8n;
  }
  const decoded = new Uint8Array(leadingZeros + reversed.length);
  reversed.reverse().forEach((byte, index) => {
    decoded[leadingZeros + index] = byte;
  });
  if (encodeBuildLinkPayload(decoded) !== encoded) throw invalidEncoding();
  return decoded;
}

function invalidEncoding(): BuildLinkCodecError {
  return new BuildLinkCodecError('invalidEncoding', 'The build-link encoding is invalid.');
}
