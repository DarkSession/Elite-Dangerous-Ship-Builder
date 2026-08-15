import type { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { BuildLinkCodecError } from './build-link-codec-error';
import { decodeBuildLinkPayload } from './build-link-radix';

export { BuildLinkCodecError } from './build-link-codec-error';
export type { BuildLinkCodecErrorCode } from './build-link-codec-error';

const FRAGMENT_PREFIX = 'b.';
const MAX_ENCODED_LENGTH = 500;

/** Encode with the current codec, loading its pinned tables only when first used. */
export async function encodeBuildLinkFragment(loadout: ShipLoadout): Promise<string> {
  const codec = await import('./build-link-codec');
  return codec.encodeBuildLinkFragment(loadout);
}

/** Decode with the payload-declared codec, loading only that version's implementation and tables. */
export async function decodeBuildLinkFragment(fragment: string): Promise<ShipLoadout> {
  const version = readPayloadVersion(fragment);
  if (version !== 1) {
    throw new BuildLinkCodecError(
      'unsupportedVersion',
      `Build-link codec version ${version} is not supported.`,
    );
  }
  const codec = await import('./build-link-codec');
  return codec.decodeBuildLinkFragment(fragment);
}

function readPayloadVersion(fragment: string): number {
  const value = fragment.startsWith('#') ? fragment.slice(1) : fragment;
  if (!value.startsWith(FRAGMENT_PREFIX)) {
    throw new BuildLinkCodecError('unsupportedVersion', 'The build-link version is not supported.');
  }
  const encoded = value.slice(FRAGMENT_PREFIX.length);
  if (encoded.length === 0 || encoded.length > MAX_ENCODED_LENGTH) {
    throw new BuildLinkCodecError('invalidEncoding', 'The encoded build has an invalid length.');
  }
  const payload = decodeBuildLinkPayload(encoded);
  if (payload.length < 2) {
    throw new BuildLinkCodecError('invalidEncoding', 'The build-link encoding is invalid.');
  }
  return payload[0]! | ((payload[1]! & 0b11) << 8);
}
