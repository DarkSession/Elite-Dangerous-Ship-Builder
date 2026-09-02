import type { LinkEnvelope, VerifiedLinkBody } from '../../build-link/build-link-envelope';
import { decodeLinkBody, encodeLinkBody } from '../../build-link/build-link-envelope';

/**
 * The ship builder's own envelope.
 *
 * The bound FR-021 states: a complete codec value, `b.` included, leaving 498 encoded digits.
 *
 * The requirement is stated over the codec value rather than the URL carrying it, because the
 * origin, path and `#` belong to wherever the application is deployed and this layer never sees
 * them. A deployment whose own URL is long enough to matter is the sharing feature's problem to
 * notice, not something the codec could have enforced.
 */
const MAX_LINK_CHARACTERS = 500;
const BUILD_LINK_ENVELOPE: LinkEnvelope = { prefix: 'b.', maxCharacters: MAX_LINK_CHARACTERS };

/** A codec body whose Base70 envelope and CRC-32 have already been verified. */
export type VerifiedBuildLinkBody = VerifiedLinkBody;

/** Add the permanent envelope and integrity check to a codec body. */
export function encodeBuildLinkBody(body: Uint8Array): string {
  return encodeLinkBody(body, BUILD_LINK_ENVELOPE);
}

/** Decode and verify the generic envelope before selecting a codec table. */
export function decodeBuildLinkBody(fragment: string): VerifiedBuildLinkBody {
  return decodeLinkBody(fragment, BUILD_LINK_ENVELOPE);
}
