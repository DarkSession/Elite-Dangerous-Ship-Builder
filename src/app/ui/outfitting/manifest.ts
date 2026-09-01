import { DestroyRef, ElementRef, inject, signal, type Signal } from '@angular/core';
import { RAIL_MINIMUM_REM } from './composition';

/**
 * Which of canvas 1c's and 1d's two manifests the chooser is drawing.
 *
 * `rail` is canvas 1c since the 2026-08-25 revision: a family rail beside a
 * variant pane, exactly one family selected, three columns on a row. `accordion`
 * is canvas 1d, unchanged: stacked cards under family bars with carets, any
 * number of them open.
 */
export type CandidateManifest = 'rail' | 'accordion';

/**
 * Watches the chooser's own inline size and reports which manifest fits.
 *
 * The arrangement could be a container query and was one until the revision.
 * What cannot be is the **reveal rule**: a rail selects exactly one family and
 * an accordion opens any number, and that decision is made where the revealed
 * set is held, not in a stylesheet. Two thresholds — one in CSS, one here —
 * would disagree for a frame on every resize, and the disagreement is not
 * cosmetic: a rail drawn while the accordion's rule is seeding the set can be
 * handed no family to reveal and paint an empty pane. So this is the single
 * source, the stylesheet keys off the attribute it publishes, and there is one
 * threshold rather than two.
 *
 * A renderer with no `ResizeObserver` gets the accordion, which is the manifest
 * that needs no measurement to be drawable.
 */
export function observeManifest(): Signal<CandidateManifest> {
  const host = inject(ElementRef<HTMLElement>).nativeElement;
  const manifest = signal<CandidateManifest>('accordion');

  if (typeof ResizeObserver === 'undefined') {
    return manifest.asReadonly();
  }

  const measure = (width: number): void => {
    // The root size is read each time, so a text-scale change moves the
    // threshold with it rather than leaving it at load-time pixels.
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    manifest.set(width / rem >= RAIL_MINIMUM_REM ? 'rail' : 'accordion');
  };

  const observer = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (entry !== undefined) {
      measure(entry.contentRect.width);
    }
  });
  observer.observe(host);
  measure(host.getBoundingClientRect().width);

  inject(DestroyRef).onDestroy(() => observer.disconnect());

  return manifest.asReadonly();
}
