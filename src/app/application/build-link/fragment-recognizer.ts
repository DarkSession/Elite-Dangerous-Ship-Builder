/**
 * The prefix that makes a fragment a build link.
 *
 * A fragment is shared space. A deep link, an anchor and a third-party tool's
 * marker all live there too, so a build is claimed by an explicit prefix and
 * everything else is left alone rather than guessed at.
 */
export const BUILD_LINK_PREFIX = 'b.';

/**
 * The longest value this application will accept or publish.
 *
 * Counted including the prefix and excluding the `#`, origin and base path,
 * which is exactly how the build-link contract states it ("Canonical form").
 */
export const MAX_BUILD_LINK_LENGTH = 500;

/** What a fragment turned out to be. */
export type FragmentRecognition =
  /** Not a build link. Left uninterpreted — it may belong to something else. */
  | { readonly kind: 'unrelated' }
  /** A build link within the published bound, ready to decode. */
  | { readonly kind: 'build'; readonly fragment: string }
  /** A build link too long to be one this application produced. */
  | { readonly kind: 'over-limit'; readonly length: number };

/**
 * Decides what a raw fragment is, before anything decodes it.
 *
 * The length bound is checked here rather than inside the codec because it is
 * a bound on what may be *attempted*: a 40 kB fragment pasted into the address
 * bar is rejected without allocating a decoder for it (build-link contract,
 * "Ingress pipeline", step 2).
 *
 * The value is taken exactly as it appears. No trimming, no case folding and no
 * percent-decoding: a build link is an opaque token, and quietly repairing one
 * would mean accepting a value the codec's integrity check is about to reject
 * anyway, having changed it first.
 */
export function recognizeBuildLinkFragment(raw: string): FragmentRecognition {
  const value = raw.startsWith('#') ? raw.slice(1) : raw;

  if (!value.startsWith(BUILD_LINK_PREFIX)) {
    return { kind: 'unrelated' };
  }
  if (value.length > MAX_BUILD_LINK_LENGTH) {
    return { kind: 'over-limit', length: value.length };
  }
  return { kind: 'build', fragment: value };
}
