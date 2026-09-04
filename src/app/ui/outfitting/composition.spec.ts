import { ChangeDetectionStrategy, Component, type Signal } from '@angular/core';
import { renderComponent } from '../components/ui-component.spec-helpers';
import { observeComposition, type OutfittingComposition } from './composition';
import { declareMeasurement, declareResizeObserver } from '../measurement.spec-helpers';

/**
 * The composition follows the space the region was actually given.
 *
 * The property under test is that the thresholds are *content* minimums in rem
 * rather than viewport pixels: a Commander who has doubled their text size gets
 * the compact composition at a width that would have been wide before, because
 * the same content no longer fits. A pixel threshold would silently keep the
 * two-pane layout and narrow both panes past what they can hold.
 */

@Component({
  selector: 'ednb-composition-host',
  template: '<div class="host"></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class CompositionHost {
  readonly composition: Signal<OutfittingComposition> = observeComposition();
}

/** The undo for whatever this test declared, run after it. */
let restore: (() => void) | null = null;

/**
 * Sets the host's measured width, since jsdom lays nothing out on its own.
 *
 * Which prototype carries the patch, and what putting it back means, are both
 * decided in `measurement.spec-helpers` — a spec that undoes one of these by
 * assignment leaves the genuine method behind as an own property, shadowing
 * the one every other spec patches (see that file).
 */
function withWidth(width: number): void {
  restore?.();
  restore = declareMeasurement({ width, right: width });
}

/** The root text size the thresholds are measured against. */
function withRootFontSize(px: number): void {
  document.documentElement.style.fontSize = `${px}px`;
}

describe('outfitting composition', () => {
  let observed: (() => void) | null = null;

  beforeEach(() => {
    // The renderer under test observes resizes; the initial measurement is the
    // synchronous one, which is what these thresholds are about. A no-op
    // observer keeps that path honest without simulating a resize.
    observed = declareResizeObserver();
  });

  afterEach(() => {
    document.documentElement.style.fontSize = '';
    restore?.();
    restore = null;
    observed?.();
    observed = null;
  });

  it('uses the compact composition when the ledger and bench cannot both fit', () => {
    withRootFontSize(16);
    // 20rem + 22.5rem is 680px at a 16px root; 600 is not enough for both.
    withWidth(600);

    const fixture = renderComponent(CompositionHost);

    expect(fixture.componentInstance.composition()).toBe('compact');
  });

  it('uses two panes once both declared minimums fit', () => {
    withRootFontSize(16);
    withWidth(800);

    const fixture = renderComponent(CompositionHost);

    expect(fixture.componentInstance.composition()).toBe('two-pane');
  });

  it('uses the wide composition once the rail fits without folding the bench', () => {
    withRootFontSize(16);
    // 24.5 + 42.25 + 19.125rem is 1374px at a 16px root: the two fixed rails,
    // and between them what the bench has to keep rather than what one
    // candidate row needs.
    withWidth(1400);

    const fixture = renderComponent(CompositionHost);

    expect(fixture.componentInstance.composition()).toBe('wide');
  });

  it('keeps two panes where a third region would be paid for out of the bench', () => {
    // The three tracks fit from 1058px measured against the bench's own floor,
    // and across the band up to 1374px the bench they leave never reaches the
    // 676px the chooser's aligned manifest needs. A third column bought by
    // folding the middle one back to one candidate row is not a third column
    // worth having (Commander request 2026-08-31).
    withRootFontSize(16);
    withWidth(1200);

    const fixture = renderComponent(CompositionHost);

    expect(fixture.componentInstance.composition()).toBe('two-pane');
  });

  it('falls back to compact when the reader has doubled their text size', () => {
    // The same 800px that held two panes at a 16px root holds neither at 32px,
    // because the content in them is twice as large. A pixel threshold would
    // keep the two-pane layout and clip both.
    withRootFontSize(32);
    withWidth(800);

    const fixture = renderComponent(CompositionHost);

    expect(fixture.componentInstance.composition()).toBe('compact');
  });
});
