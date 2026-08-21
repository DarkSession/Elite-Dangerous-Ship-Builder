import { DestroyRef, ElementRef, inject, signal, type Signal } from '@angular/core';

/**
 * Which composition the outfitting region is currently in.
 *
 * `wide` is canvas 1c's three regions, `two-pane` its ledger and bench without
 * the rail, and `compact` canvas 1d's single flow with full-screen layers.
 */
export type OutfittingComposition = 'wide' | 'two-pane' | 'compact';

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
  /** A slot card's key, one wrapped module name and its 44px controls. */
  ledger: 20,
  /** A candidate row's name, class, rating, mount and a 44px fit control. */
  bench: 22.5,
  /** One validation or cost line with its number and unit, on two lines. */
  rail: 17.5,
} as const;

/**
 * Watches the host's own inline size and reports which composition fits.
 *
 * A `ResizeObserver` rather than a media query, because the question is how much
 * space *this region* was given, not how wide the window is — the same region
 * inside a narrower shell, at 400% zoom or beside expanded text has less room
 * and should compose accordingly (responsive composition, "Reference and
 * selection rule").
 *
 * Most of the arrangement is done in CSS container queries, which need none of
 * this. What needs it is the one decision CSS cannot make: whether the bench is
 * an inline region or a modal layer that makes the rest of the page inert.
 */
export function observeComposition(): Signal<OutfittingComposition> {
  const host = inject(ElementRef<HTMLElement>).nativeElement;
  const composition = signal<OutfittingComposition>('compact');

  const measure = (inlineSize: number): void => {
    // Read the root size each time, so a text-scale change moves the
    // thresholds with it rather than leaving them at load-time pixels.
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const rems = inlineSize / rem;

    if (rems >= MINIMUMS.ledger + MINIMUMS.bench + MINIMUMS.rail) {
      composition.set('wide');
    } else if (rems >= MINIMUMS.ledger + MINIMUMS.bench) {
      composition.set('two-pane');
    } else {
      composition.set('compact');
    }
  };

  if (typeof ResizeObserver === 'undefined') {
    // A renderer without the observer gets the compact composition, which is
    // the one that carries every capability in the least space.
    return composition.asReadonly();
  }

  const observer = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (entry !== undefined) {
      measure(entry.contentRect.width);
    }
  });
  observer.observe(host);
  measure(host.getBoundingClientRect().width);

  inject(DestroyRef).onDestroy(() => observer.disconnect());

  return composition.asReadonly();
}
