import { DOCUMENT, Injectable, inject } from '@angular/core';

/** One element's content box, in CSS pixels. */
export interface ElementSize {
  readonly width: number;
  readonly height: number;
}

/**
 * How big one of the application's own boxes currently is.
 *
 * This measures **layout**, never artwork. The distinction matters here more
 * than anywhere else in the application: feature 010's FR-003 forbids deriving
 * mount geometry from the rendered document, and
 * `scripts/policy/anatomy-ownership.mjs` enforces that by banning `getBBox`,
 * `getScreenCTM`, `getBoundingClientRect` and the rest from the anatomy source.
 * What this reports is the CSS size of a box the stylesheet decided — a plate's
 * frame, a mark's own square — which is a fact about this application's layout
 * and not a fact about the hull. No mount position is read through it, and the
 * anatomy still takes every coordinate from the package's own extract.
 *
 * It lives in the platform layer for the same reason: a `ResizeObserver` is a
 * browser capability, and a component that constructed one directly would be
 * untestable without a DOM and unusable without a browser.
 */
@Injectable({ providedIn: 'root' })
export class ElementSizeAdapter {
  readonly #window = inject(DOCUMENT).defaultView;

  /**
   * Calls `report` with `element`'s content box, now and whenever it changes.
   *
   * A callback rather than a signal, deliberately. A caller that wrote the size
   * into a signal it also read while setting the observer up would re-enter its
   * own effect on every resize — tearing the observer down, building a new one
   * and publishing that new one's unmeasured zero. That is not a hypothetical:
   * it is what the first version of this did, and the plate it fed reported a
   * zero-width frame for ever after the first resize. Pushing outward has no
   * such cycle.
   *
   * Reports nothing, ever, where there is no browser or no `ResizeObserver`, so
   * a caller must already have an answer for "not measured yet" — which is the
   * same answer it needs for the first frame.
   *
   * Returns the function that stops it.
   */
  observe(element: Element, report: (size: ElementSize) => void): () => void {
    const view = this.#window;
    if (!view || typeof view.ResizeObserver !== 'function') {
      return () => {};
    }

    const observer = new view.ResizeObserver((entries) => {
      const box = entries.at(-1)?.contentRect;
      if (box !== undefined) {
        report({ width: box.width, height: box.height });
      }
    });
    observer.observe(element);

    return () => observer.disconnect();
  }
}
