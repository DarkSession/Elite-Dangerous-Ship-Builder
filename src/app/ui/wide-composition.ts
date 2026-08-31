import { DestroyRef, inject, signal, type Signal } from '@angular/core';

/**
 * The width at and above which the application draws more than one region.
 *
 * The master-detail compositions start here: the shipyard's inspector rail
 * beside its manifest, and the workspace's own regions beside each other.
 * Below it there is one flow, and a screen opened over another one is the whole
 * screen (`_responsive.scss`, `$mode-wide-min`; responsive composition,
 * "Derived layout modes").
 *
 * Declared here as well as in the stylesheets because one *behaviour* turns on
 * it rather than one arrangement, and behaviour is decided in TypeScript.
 * Stating it at a second figure of its own would let that behaviour and the
 * stylesheets disagree about which composition is on screen, which is the
 * disagreement this exists to prevent.
 *
 * In rem, like the stylesheets' own step, so a window zoomed down to a single
 * region is treated as the single region it is.
 */
export const WIDE_MODE_MIN_REM = 64;

/** The stylesheets' own query, composed from that width. */
export const WIDE_COMPOSITION = `(min-width: ${WIDE_MODE_MIN_REM}rem)`;

/**
 * Whether resting a pointer on a shipyard manifest row can read the hull it
 * names.
 *
 * Two things have to hold, and they are asked as one query so a window dragged
 * across the rail's own width cannot answer them a frame apart.
 *
 * The **device** has to be able to rest a pointer somewhere without pressing. A
 * touch screen cannot: there the press opens the hull instead, and the sheet's
 * own action builds it (constitution III, "touch as well as pointer").
 *
 * And the **rail** has to be drawn, because that is where the reading appears.
 * Below the rail's own width the hull detail is canvas 1b's sheet over the
 * whole screen, so resting opened that sheet over the manifest it was being
 * read from, one hull after another, with no press behind any of it (Commander
 * request 2026-08-31).
 *
 * Asked here, by the route region that draws the rail, rather than by the
 * manifest inside it: a reusable component composes from the box it is given,
 * and the width of that box does not say whether there is a rail beside it —
 * the manifest is wider at the rail's width than it is without one. The same
 * pair decides whether the sheet draws its own create action, in the hull
 * detail's stylesheet, so exactly one of the two carries the transaction at
 * every width (`design/hull-catalogue.md`, "Resting reads a hull only where the
 * rail is drawn").
 *
 * Guarded because the renderer used for tests and prerendering has no
 * `matchMedia`, and a shipyard that throws there renders nothing at all. Absent,
 * the answer is the one that asks for a press, which every device can make.
 */
export function observeRestingReads(): Signal<boolean> {
  const query =
    typeof matchMedia === 'function' ? matchMedia(`(hover: hover) and ${WIDE_COMPOSITION}`) : null;
  const reads = signal(query?.matches ?? false);
  if (query === null) {
    return reads.asReadonly();
  }

  const follow = (): void => reads.set(query.matches);
  query.addEventListener('change', follow);
  inject(DestroyRef).onDestroy(() => query.removeEventListener('change', follow));
  return reads.asReadonly();
}
