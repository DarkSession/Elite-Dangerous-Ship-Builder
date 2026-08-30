import { DestroyRef, ElementRef, inject, signal, type Signal } from '@angular/core';
import { SHORT_VIEWPORT as SHORT_VIEWPORT_QUERY } from '../short-viewport';

/**
 * Which composition the outfitting region is currently in.
 *
 * `wide` is canvas 1c's three regions, `two-pane` its ledger and bench without
 * the rail, and `compact` canvas 1d's single flow with full-screen layers.
 */
export type OutfittingComposition = 'wide' | 'two-pane' | 'compact';

/**
 * What a candidate row needs: its name, class, rating, mount and a 44px control.
 *
 * Exported because the chooser's own manifest threshold is built from it — a
 * rail beside a pane is this minimum plus the canvas's fixed rail — and the two
 * decisions should not be able to drift apart (`manifest.ts`).
 */
export const BENCH_CONTENT_MINIMUM_REM = 22.5;

/**
 * The declared content minimums, in rem.
 *
 * These are the sizes recorded in the responsive-composition document, and they
 * are content minimums rather than viewport labels: a region that cannot hold a
 * slot card's wrapped module name and its 44px controls does not get narrowed
 * below them, the composition changes instead. Expressed in rem so a Commander
 * who has doubled their text size gets the compact composition for the same
 * reason a narrow window does.
 */
const MINIMUMS = {
  /**
   * The ledger's rail: canvas 1c's own 392px leading track.
   *
   * **Corrected 2026-08-22 (wave 9): 20 to 24.5.** This was the width a slot
   * card's wrapped name and its 44px controls need, but the wide grid's leading
   * track is not that — it is the canvas's fixed rail, and always has been. The
   * two thresholds this feeds therefore opened 4.5rem before the grid could hold
   * itself, and the panes' minimums added up to more than the grid they sat in.
   * The application frame's own side padding kept the container under the
   * threshold at the widths it would have bitten; with that inset gone — the
   * canvas draws no page frame — the workspace stayed wide at 1440px with
   * doubled text and ran past the window (FR-011).
   */
  ledger: 24.5,
  /** A candidate row's name, class, rating, mount and a 44px fit control. */
  bench: BENCH_CONTENT_MINIMUM_REM,
  /**
   * The rail's own track in canvas 1c's grid.
   *
   * **Corrected 2026-08-30: 17.5 to 19.125.** This was one validation or cost
   * line with its number and unit on two lines, which is what the rail's
   * *content* needs — but the third column is a fixed track, and the grid
   * reserves 19.125rem for it. So this reported `wide` 1.625rem before the grid
   * would draw three columns, and in that band the region was a two-column grid
   * that believed it had a rail: the status ran full width under the bench,
   * which is where the reading squeezed below the module details came from.
   */
  rail: 19.125,
} as const;

/**
 * The height below which nothing can be stacked, in the CSS's own words.
 *
 * The same query the stylesheets use for the sticky feet and the released
 * bounds, composed from the single declaration of that height. Below it a
 * viewport cannot show a ledger, a fitting panel and an engineering panel one
 * under another and still show a row of any of them: the inline compositions
 * become one page thousands of pixels long with the last panel unreachable in
 * practice. So height alone selects the compact composition, exactly as 400%
 * zoom does (responsive composition, "Reference and selection rule").
 */
const SHORT_VIEWPORT = SHORT_VIEWPORT_QUERY;

/**
 * Watches the host's own inline size and reports which composition fits.
 *
 * A `ResizeObserver` rather than a media query for the width, because the
 * question is how much space *this region* was given, not how wide the window
 * is — the same region inside a narrower shell, at 400% zoom or beside expanded
 * text has less room and should compose accordingly. Height is the one part
 * that is genuinely the viewport's rather than the region's, and it is read
 * through the stylesheets' own query so the CSS and this decision cannot
 * disagree.
 *
 * Most of the arrangement is done in CSS container queries, which need none of
 * this. What needs it is the one decision CSS cannot make: whether the bench is
 * an inline region or a modal layer that makes the rest of the page inert.
 */
export function observeComposition(): Signal<OutfittingComposition> {
  const host = inject(ElementRef<HTMLElement>).nativeElement;
  const composition = signal<OutfittingComposition>('compact');
  const short = typeof matchMedia === 'function' ? matchMedia(SHORT_VIEWPORT) : null;
  let width = 0;

  const measure = (): void => {
    if (short?.matches === true) {
      composition.set('compact');
      return;
    }

    // Read the root size each time, so a text-scale change moves the
    // thresholds with it rather than leaving them at load-time pixels.
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const rems = width / rem;

    if (rems >= MINIMUMS.ledger + MINIMUMS.bench + MINIMUMS.rail) {
      composition.set('wide');
    } else if (rems >= MINIMUMS.ledger + MINIMUMS.bench) {
      composition.set('two-pane');
    } else {
      composition.set('compact');
    }
  };

  short?.addEventListener('change', measure);
  inject(DestroyRef).onDestroy(() => short?.removeEventListener('change', measure));

  if (typeof ResizeObserver === 'undefined') {
    // A renderer without the observer gets the compact composition, which is
    // the one that carries every capability in the least space.
    return composition.asReadonly();
  }

  const observer = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (entry !== undefined) {
      width = entry.contentRect.width;
      measure();
    }
  });
  observer.observe(host);
  width = host.getBoundingClientRect().width;
  measure();

  inject(DestroyRef).onDestroy(() => observer.disconnect());

  return composition.asReadonly();
}
