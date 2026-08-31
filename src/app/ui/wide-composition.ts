import { DestroyRef, inject, signal, type Signal } from '@angular/core';

/**
 * The application's own step for a page that composes more than one region.
 *
 * The shipyard's inspector rail appears here, beside its manifest, and below it
 * a screen opened over another one is the whole screen. Regions that compose
 * from the room they were each given — the outfitting workspace's do — reach
 * their own arrangements at their own container steps and are not governed by
 * this; what this names is the page (`_responsive.scss`, `$mode-wide-min`;
 * responsive composition, "Derived layout modes").
 *
 * Restated here because one *behaviour* turns on it rather than one
 * arrangement, and behaviour is decided in TypeScript rather than in a
 * stylesheet. It is a second statement of a figure the stylesheets own, so the
 * two are reconciled by `scripts/check-interface-foundations.mjs` rather than by
 * this comment promising they agree.
 *
 * In rem because the stylesheets state it that way, and the point of restating
 * it is that it is the same figure. The rail this answers for is drawn by a
 * media query at this same step, so the two are the same query and cannot
 * disagree about a width.
 *
 * That is what makes a media query the right one *here*, and it is not the right
 * one everywhere: an arrangement that folds with a `font-size` set on the root
 * element has to be asked of a container, which this cannot be
 * (`_responsive.scss`, `$outfitting-regions-min`; `ui/short-viewport.ts`).
 */
const WIDE_MODE_MIN_REM = 64;

/** The stylesheets' own query, composed from that width. */
const WIDE_COMPOSITION = `(min-width: ${WIDE_MODE_MIN_REM}rem)`;

/**
 * Whether resting a pointer on a shipyard manifest row can read the hull it
 * names.
 *
 * Two things have to hold, and they are asked as one query so a window dragged
 * across the rail's own width cannot answer them a frame apart.
 *
 * The **device** has to be able to rest a pointer somewhere without pressing. A
 * touch screen cannot: there the press opens the hull instead, and the sheet's
 * own action builds it (constitution V, "Works on Desktop, Tablet and Mobile").
 *
 * And the **rail** has to be drawn, because that is where the reading appears.
 * Below the rail's own width the hull detail is canvas 1b's sheet over the
 * whole screen, so resting opened that sheet over the manifest it was being
 * read from, one hull after another, with no press behind any of it (Commander
 * request 2026-08-31).
 *
 * Asked here, by the route region that draws the rail, rather than by the
 * manifest inside it: a reusable component composes from the box it is given,
 * and the width of that box cannot say whether there is a rail beside it. The
 * two ranges overlap rather than meeting — the manifest is 640px wide at 1024
 * with a rail and 979px at 1023 without one, and it passes back through 640 to
 * 979 as the page grows — so no width it could measure separates them. The same
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
