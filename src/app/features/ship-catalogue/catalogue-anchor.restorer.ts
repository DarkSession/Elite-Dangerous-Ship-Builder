import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import { CatalogueSessionStore } from '../../application/catalogue/catalogue-session.store';

/** The attribute a catalogue row or card carries so it can be found again. */
export const ANCHOR_ATTRIBUTE = 'data-hull-symbol';

/**
 * Putting the Commander back where they were.
 *
 * Restoring a scroll offset alone does not work here: the manifest and the card
 * list are different heights, translated names wrap differently, and an
 * illustration that loads late moves everything below it. So the anchor is a
 * *hull*, plus how far into that hull's own row the viewport was — which
 * survives all three (FR-003).
 *
 * Restoration waits for a frame after the rows exist, because a measurement
 * taken while the list is still laying out reads the wrong offset and scrolls
 * to the wrong place.
 */
@Injectable({ providedIn: 'root' })
export class CatalogueAnchorRestorer {
  readonly #document = inject(DOCUMENT);
  readonly #session = inject(CatalogueSessionStore);

  readonly #selected = signal<string | null>(null);

  /** The hull currently open in the detail view, for the selected marker. */
  readonly selectedSymbol = this.#selected.asReadonly();

  setSelected(symbol: string | null): void {
    this.#selected.set(symbol);
  }

  /** How far into a hull's own row the viewport currently is. */
  offsetOf(symbol: string): number {
    const element = this.#elementFor(symbol);
    if (element === null) {
      return 0;
    }
    // Negative once the row's top has scrolled above the viewport, which is
    // exactly the offset that has to be restored.
    return -element.getBoundingClientRect().top;
  }

  /**
   * Scrolls the remembered hull back to where it was.
   *
   * Returns whether it could: a hull filtered out since the anchor was taken
   * has no row to scroll to, and the honest answer is to leave the list where
   * it is rather than jump somewhere arbitrary.
   */
  restore(): boolean {
    const anchor = this.#session.anchor();
    if (anchor === null) {
      return false;
    }

    const element = this.#elementFor(anchor.symbol);
    if (element === null) {
      return false;
    }

    const view = this.#document.defaultView;
    const top =
      element.getBoundingClientRect().top + (view?.scrollY ?? 0) - anchor.offsetWithinItem;
    view?.scrollTo({ top, behavior: 'auto' });
    return true;
  }

  /** Restores once the rows have actually been laid out. */
  restoreWhenSettled(): void {
    const view = this.#document.defaultView;
    if (!view) {
      return;
    }
    view.requestAnimationFrame(() => {
      if (!this.restore()) {
        // One more frame: the card list can still be resolving its own height
        // on the first, particularly with a late-arriving translation.
        view.requestAnimationFrame(() => this.restore());
      }
    });
  }

  /**
   * Finds a hull's row by attribute value rather than by building a selector.
   *
   * A symbol goes straight into a selector otherwise, and quoting one correctly
   * needs `CSS.escape`, which is not present in every runtime this code is
   * exercised in. Comparing the attribute is shorter and cannot be broken by a
   * value with punctuation in it.
   */
  #elementFor(symbol: string): HTMLElement | null {
    const candidates = this.#document.querySelectorAll<HTMLElement>(`[${ANCHOR_ATTRIBUTE}]`);
    for (const candidate of candidates) {
      if (candidate.getAttribute(ANCHOR_ATTRIBUTE) === symbol) {
        return candidate;
      }
    }
    return null;
  }
}
