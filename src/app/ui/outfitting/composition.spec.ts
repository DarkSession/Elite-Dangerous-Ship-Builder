import { ChangeDetectionStrategy, Component, type Signal } from '@angular/core';
import { renderComponent } from '../components/ui-component.spec-helpers';
import { observeComposition, type OutfittingComposition } from './composition';

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
  selector: 'edsb-composition-host',
  template: '<div class="host"></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class CompositionHost {
  readonly composition: Signal<OutfittingComposition> = observeComposition();
}

/** The prototype's own measurement, so the patch below can be undone. */
const MEASURE = HTMLElement.prototype.getBoundingClientRect;

/**
 * Sets the host's measured width, since jsdom lays nothing out on its own.
 *
 * `writable` matters here. A prototype property defined without it is
 * non-writable, and a *later* spec in the same worker assigning its own
 * `element.getBoundingClientRect` then throws in strict mode — a failure with
 * nothing to do with the file it lands in, appearing and disappearing as the
 * suite is re-sharded. The patch is undone after each test for the same reason.
 */
function withWidth(width: number): void {
  Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
    configurable: true,
    writable: true,
    value: () => ({ width, height: 0, top: 0, left: 0, right: width, bottom: 0 }),
  });
}

/** The root text size the thresholds are measured against. */
function withRootFontSize(px: number): void {
  document.documentElement.style.fontSize = `${px}px`;
}

describe('outfitting composition', () => {
  beforeEach(() => {
    // The renderer under test observes resizes; the initial measurement is the
    // synchronous one, which is what these thresholds are about. A no-op
    // observer keeps that path honest without simulating a resize.
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
      observe(): void {}
      disconnect(): void {}
      unobserve(): void {}
    };
  });

  afterEach(() => {
    document.documentElement.style.fontSize = '';
    HTMLElement.prototype.getBoundingClientRect = MEASURE;
    delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
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

  it('uses the wide composition once the rail fits as well', () => {
    withRootFontSize(16);
    // 20 + 22.5 + 17.5 rem is 960px at a 16px root.
    withWidth(1200);

    const fixture = renderComponent(CompositionHost);

    expect(fixture.componentInstance.composition()).toBe('wide');
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
