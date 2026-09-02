/**
 * What the build says about its hardpoints, as a fact rather than a count.
 *
 * A type-only contract leaf, published here so feature 007 can compile against
 * it before feature 002's adapter exists. It is deliberately three states and
 * not a number: "no weapons" and "we could not tell" are different answers, and
 * a consumer that receives `0` cannot distinguish them. An offence profile that
 * reported "no weapons fitted" because a slot query failed would be stating
 * something about the build that nobody checked.
 *
 * `weapons.length` is not a substitute. A build's weapon metrics list the
 * weapons the package could measure, which is not the same set as the hardpoint
 * mounts the hull has — an unpowered or unmeasurable weapon occupies a mount
 * without appearing there.
 */
export type HardpointCoverage =
  /** Every package hardpoint mount on this hull is empty. */
  | { readonly kind: 'confirmedEmpty' }
  /** Every package hardpoint mount resolved; these ones carry a module. */
  | { readonly kind: 'complete'; readonly occupiedSlots: readonly string[] }
  /** The package slot views could not answer. Never report this as empty. */
  | { readonly kind: 'unavailable' };
