import type { ModuleRating } from '@elite-dangerous-almanac/core/ships/modules';

/**
 * Every grade letter the package publishes, in the order a chooser lists them.
 *
 * `Record<ModuleRating, number>` is the whole enforcement mechanism. A release
 * that adds a grade leaves a key missing and this file stops compiling; a
 * release that drops one leaves a key that no longer exists and it stops
 * compiling too. Either way the ordering is reviewed against the package rather
 * than a new letter being silently sorted to one end (module-catalogue
 * contract, "Sections, groups and order").
 *
 * The order is the package's own: `A` is the best grade and `I` the armour
 * placeholder, so listing ascending puts the best first — which is the order
 * canvas 1c draws the chooser in.
 */
const RATING_ORDER: Record<ModuleRating, number> = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
  E: 4,
  F: 5,
  G: 6,
  H: 7,
  I: 8,
};

/** Every rating the package publishes, in listing order. Tests read this. */
export const RATINGS_IN_ORDER = Object.keys(RATING_ORDER) as readonly ModuleRating[];

/** Orders two grade letters ascending, `A` first. */
export function compareRating(left: ModuleRating, right: ModuleRating): number {
  return RATING_ORDER[left] - RATING_ORDER[right];
}
