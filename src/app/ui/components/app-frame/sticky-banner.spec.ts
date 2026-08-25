import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  viewChild,
  type Signal,
} from '@angular/core';
import { renderComponent } from '../ui-component.spec-helpers';
import { observeBanner } from './sticky-banner';

/**
 * The banner keeps the top of the screen only while it can afford to.
 *
 * The property under test is that the threshold is the bar's share of the
 * window rather than a viewport size: the same window, the same bar and a
 * Commander who has doubled their text size is a bar that has wrapped, and the
 * decision has to move with it. A viewport-only rule keeps a five-row German
 * command bar frozen over more than half a tablet.
 */

@Component({
  selector: 'edsb-sticky-banner-host',
  template: '<header #banner></header>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class StickyBannerHost {
  protected readonly banner = viewChild<ElementRef<HTMLElement>>('banner');
  readonly #banner = observeBanner(this.banner);
  readonly released: Signal<boolean> = this.#banner.released;
  readonly height: Signal<number | null> = this.#banner.height;
}

/** The prototype's own measurement, so the patch below can be undone. */
const MEASURE = HTMLElement.prototype.getBoundingClientRect;
const HEIGHT = Object.getOwnPropertyDescriptor(window, 'innerHeight');

/**
 * Sets the bar's measured height, since jsdom lays nothing out on its own.
 *
 * `writable` matters here for the same reason it does in the composition spec:
 * a prototype property defined without it makes a *later* spec's own assignment
 * throw, which is a failure with nothing to do with the file it lands in.
 */
function withBarHeight(height: number): void {
  Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
    configurable: true,
    writable: true,
    value: () => ({ width: 0, height, top: 0, left: 0, right: 0, bottom: height }),
  });
}

/** The window the bar is taking a share of. */
function withWindowHeight(height: number): void {
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
}

/** The root text size the threshold is measured against. */
function withRootFontSize(px: number): void {
  document.documentElement.style.fontSize = `${px}px`;
}

describe('the sticky banner', () => {
  beforeEach(() => {
    // The measurement under test observes resizes; the initial reading is the
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
    if (HEIGHT !== undefined) {
      Object.defineProperty(window, 'innerHeight', HEIGHT);
    }
    delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
  });

  it('keeps its place while it leaves a viewport that can still be stacked in', () => {
    withRootFontSize(16);
    withWindowHeight(834);
    // The bar every screen draws at an ordinary text size, which leaves far
    // more than the 480px that 30rem is here.
    withBarHeight(74);

    const fixture = renderComponent(StickyBannerHost);

    expect(fixture.componentInstance.released()).toBe(false);
  });

  it('releases once what it leaves below is a short viewport', () => {
    withRootFontSize(16);
    withWindowHeight(834);
    withBarHeight(400);

    const fixture = renderComponent(StickyBannerHost);

    expect(fixture.componentInstance.released()).toBe(true);
  });

  it('releases the same bar in the same window once the text is doubled', () => {
    // The failing case, in its own terms: a tablet held in landscape, a bar
    // that wrapped to five rows of German, and a threshold that has doubled
    // with the Commander's text rather than staying at load-time pixels.
    withRootFontSize(32);
    withWindowHeight(834);
    withBarHeight(462);

    const fixture = renderComponent(StickyBannerHost);

    expect(fixture.componentInstance.released()).toBe(true);
  });

  it('publishes the height the bar actually came out at, not the declared one', () => {
    // The reading every sticky region below the bar offsets by. The workspace's
    // bar is taller than the token's one-row figure because its identity block
    // is two 24px targets, and a wrapped bar is taller again; a region handed
    // the declared figure freezes behind the bar and stands its own foot short
    // of the screen's by the difference.
    withRootFontSize(16);
    withWindowHeight(1000);
    withBarHeight(74);

    const fixture = renderComponent(StickyBannerHost);

    expect(fixture.componentInstance.height()).toBe(74);
  });

  it('holds its place in a renderer with no resize observer', () => {
    delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
    withRootFontSize(16);
    withWindowHeight(834);
    withBarHeight(74);

    const fixture = renderComponent(StickyBannerHost);

    // The measurement still happens; only the watching does not. A renderer
    // that cannot observe is not a reason to freeze a bar over the page, nor
    // to release one that fits.
    expect(fixture.componentInstance.released()).toBe(false);
  });
});
