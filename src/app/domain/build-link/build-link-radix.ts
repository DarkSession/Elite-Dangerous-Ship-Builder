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
  if (leadingZeros === bytes.length) return BUILD_LINK_ALPHABET[0]!.repeat(leadingZeros);

  // Little-endian mixed-radix digits keep every intermediate bounded below 18,000,
  // independent of payload length. Position zero is Base62; all higher positions are Base69.
  const digits: number[] = [];
  for (const byte of bytes.subarray(leadingZeros)) {
    let carry = byte;
    for (let index = 0; index < digits.length; index += 1) {
      const radix = index === 0 ? BUILD_LINK_FINAL_ALPHABET.length : BUILD_LINK_ALPHABET.length;
      const value = digits[index]! * 256 + carry;
      digits[index] = value % radix;
      carry = Math.floor(value / radix);
    }
    while (carry > 0) {
      const radix =
        digits.length === 0 ? BUILD_LINK_FINAL_ALPHABET.length : BUILD_LINK_ALPHABET.length;
      digits.push(carry % radix);
      carry = Math.floor(carry / radix);
    }
  }

  const encoded = digits
    .map((digit, index) =>
      index === 0 ? BUILD_LINK_FINAL_ALPHABET[digit]! : BUILD_LINK_ALPHABET[digit]!,
    )
    .reverse()
    .join('');
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
  const bytes: number[] = [];
  for (const [position, character] of [...body].entries()) {
    const terminal = position === body.length - 1;
    const index = indexes.get(character);
    if (index === undefined || (terminal && index >= BUILD_LINK_FINAL_ALPHABET.length)) {
      throw invalidEncoding();
    }
    const radix = terminal ? BUILD_LINK_FINAL_ALPHABET.length : BUILD_LINK_ALPHABET.length;
    let carry = index;
    for (let byteIndex = bytes.length - 1; byteIndex >= 0; byteIndex -= 1) {
      const value = bytes[byteIndex]! * radix + carry;
      bytes[byteIndex] = value & 0xff;
      carry = Math.floor(value / 256);
    }
    while (carry > 0) {
      bytes.unshift(carry & 0xff);
      carry = Math.floor(carry / 256);
    }
  }

  const decoded = new Uint8Array(leadingZeros + bytes.length);
  decoded.set(bytes, leadingZeros);
  if (encodeBuildLinkPayload(decoded) !== encoded) throw invalidEncoding();
  return decoded;
}

function invalidEncoding(): BuildLinkCodecError {
  return new BuildLinkCodecError('invalidEncoding', 'The build-link encoding is invalid.');
}
