import type { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { BuildLinkCodecError } from './build-link-codec-error';

export { BuildLinkCodecError } from './build-link-codec-error';
export type { BuildLinkCodecErrorCode } from './build-link-codec-error';

const FRAGMENT_PREFIX = 'b.';
const MAX_ENCODED_LENGTH = 8_192;
const CURRENT_CODEC_VERSION = 1;

/** Encode with the current codec, loading its pinned tables only when first used. */
export async function encodeBuildLinkFragment(loadout: ShipLoadout): Promise<string> {
  const codec = await import('./build-link-codec');
  return codec.encodeBuildLinkFragment(loadout);
}

/** Decode with the payload-declared codec, loading only that version's implementation and tables. */
export async function decodeBuildLinkFragment(fragment: string): Promise<ShipLoadout> {
  const version = readPayloadVersion(fragment);
  switch (version) {
    case CURRENT_CODEC_VERSION: {
      const codec = await import('./build-link-codec');
      return codec.decodeBuildLinkFragment(fragment);
    }
    default:
      throw new BuildLinkCodecError(
        'unsupportedVersion',
        `Build-link codec version ${version} is not supported.`,
      );
  }
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
  if (!/^[A-Za-z0-9_-]+$/u.test(encoded) || encoded.length % 4 === 1) {
    throw new BuildLinkCodecError('invalidEncoding', 'The build-link encoding is invalid.');
  }
  try {
    const leading = encoded.slice(0, 4).replaceAll('-', '+').replaceAll('_', '/').padEnd(4, '=');
    const binary = atob(leading);
    if (binary.length === 0) {
      throw new BuildLinkCodecError('invalidEncoding', 'The build-link encoding is invalid.');
    }
    return binary.charCodeAt(0);
  } catch (error) {
    if (error instanceof BuildLinkCodecError) throw error;
    throw new BuildLinkCodecError('invalidEncoding', 'The build-link encoding is invalid.');
  }
}
