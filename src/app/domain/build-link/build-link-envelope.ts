import { BuildLinkCodecError } from './build-link-codec-error';
import { decodeBuildLinkPayload, encodeBuildLinkPayload } from './build-link-radix';

const CRC_LENGTH = 4;

declare const verifiedLinkBody: unique symbol;

/** A codec body whose Base70 envelope and CRC-32 have already been verified. */
export type VerifiedLinkBody = Uint8Array & {
  readonly [verifiedLinkBody]: true;
};

/**
 * What tells one kind of link from another.
 *
 * Both builders publish a link, and both use this envelope, so the prefix is
 * what claims a value for one codec. A decoder that accepted another tool's
 * prefix would run its integrity check over a payload it cannot read.
 */
export interface LinkEnvelope {
  /** The prefix a value of this kind opens with, `.` included. */
  readonly prefix: string;
  /** The longest value of this kind, counted with the prefix and without `#`. */
  readonly maxCharacters: number;
}

/** Add the permanent envelope and integrity check to a codec body. */
export function encodeLinkBody(body: Uint8Array, envelope: LinkEnvelope): string {
  const payload = new Uint8Array(body.length + CRC_LENGTH);
  payload.set(body);
  new DataView(payload.buffer).setUint32(body.length, crc32(body), true);
  const fragment = `${envelope.prefix}${encodeBuildLinkPayload(payload)}`;
  if (fragment.length > envelope.maxCharacters) {
    throw new BuildLinkCodecError('invalidPayload', 'The encoded build exceeds the link limit.');
  }
  return fragment;
}

/** Decode and verify the generic envelope before selecting a codec table. */
export function decodeLinkBody(fragment: string, envelope: LinkEnvelope): VerifiedLinkBody {
  const value = fragment.startsWith('#') ? fragment.slice(1) : fragment;
  if (!value.startsWith(envelope.prefix)) {
    throw new BuildLinkCodecError(
      'unsupportedEnvelope',
      'The build-link envelope is not supported.',
    );
  }

  const encoded = value.slice(envelope.prefix.length);
  if (encoded.length === 0 || value.length > envelope.maxCharacters) {
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
  return body as VerifiedLinkBody;
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
