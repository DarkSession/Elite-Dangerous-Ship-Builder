import { BuildLinkCodecError } from './build-link-codec-error';
import { decodeBuildLinkPayload, encodeBuildLinkPayload } from './build-link-radix';

const FRAGMENT_PREFIX = 'b.';
/**
 * A complete codec value, `b.` included, leaving 498 encoded digits.
 *
 * This is the codec's own bound, not FR-028. That requirement bounds the complete URL a
 * Commander copies, which carries an origin, a path and `#` that this layer never sees, so
 * satisfying it belongs to the sharing feature. The 500 here is a floor under it: a codec value
 * that already fails this can never fit a URL, and one that passes still has to be measured
 * against the deployed origin before it is offered as a link.
 */
const MAX_LINK_CHARACTERS = 500;
const CRC_LENGTH = 4;

declare const verifiedBuildLinkBody: unique symbol;

/** A codec body whose Base70 envelope and CRC-32 have already been verified. */
export type VerifiedBuildLinkBody = Uint8Array & {
  readonly [verifiedBuildLinkBody]: true;
};

/** Add the permanent envelope and integrity check to a codec body. */
export function encodeBuildLinkBody(body: Uint8Array): string {
  const payload = new Uint8Array(body.length + CRC_LENGTH);
  payload.set(body);
  new DataView(payload.buffer).setUint32(body.length, crc32(body), true);
  const fragment = `${FRAGMENT_PREFIX}${encodeBuildLinkPayload(payload)}`;
  if (fragment.length > MAX_LINK_CHARACTERS) {
    throw new BuildLinkCodecError('invalidPayload', 'The encoded build exceeds the link limit.');
  }
  return fragment;
}

/** Decode and verify the generic envelope before selecting a codec table. */
export function decodeBuildLinkBody(fragment: string): VerifiedBuildLinkBody {
  const value = fragment.startsWith('#') ? fragment.slice(1) : fragment;
  if (!value.startsWith(FRAGMENT_PREFIX)) {
    throw new BuildLinkCodecError(
      'unsupportedEnvelope',
      'The build-link envelope is not supported.',
    );
  }

  const encoded = value.slice(FRAGMENT_PREFIX.length);
  if (encoded.length === 0 || value.length > MAX_LINK_CHARACTERS) {
    throw new BuildLinkCodecError('invalidEncoding', 'The encoded build has an invalid length.');
  }

  const payload = decodeBuildLinkPayload(encoded);
  if (payload.length <= CRC_LENGTH) {
    throw new BuildLinkCodecError('invalidPayload', 'The build-link payload is truncated.');
  }

  const body = payload.subarray(0, payload.length - CRC_LENGTH);
  const expectedCrc = new DataView(
    payload.buffer,
    payload.byteOffset + body.length,
    CRC_LENGTH,
  ).getUint32(0, true);
  if (crc32(body) !== expectedCrc) {
    throw new BuildLinkCodecError('integrityCheckFailed', 'The build-link integrity check failed.');
  }
  return body as VerifiedBuildLinkBody;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffff_ffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb8_8320 : 0);
    }
  }
  return (crc ^ 0xffff_ffff) >>> 0;
}
