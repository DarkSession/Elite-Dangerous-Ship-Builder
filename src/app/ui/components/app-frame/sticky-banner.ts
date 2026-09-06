import {
  DOCUMENT,
  afterNextRender,
  effect,
  inject,
  signal,
  type ElementRef,
  type Signal,
} from '@angular/core';
import { stackableMinimum } from '../../short-viewport';

/** What one reading of the command bar tells the regions below it. */
export interface BannerMeasurement {
  /** Whether the banner has to hand the top of the screen back. */
  readonly released: Signal<boolean>;
  /**
   * How tall the bar came out, in CSS pixels, or `null` before it is read.
   *
   * `null` rather than a number, because a guess published here is a guess
   * every region below offsets by; until the bar has been measured the token
   * layer's declared height stands.
   */
  readonly height: Signal<number | null>;
}

/**
 * What the command bar is doing to the screen below it.
 *
 * Two readings from the same measurement, because they are the same question
 * asked twice: how tall is this bar, right now, in this language at this text
 * size?
 *
 * A sticky banner takes a share of the viewport for as long as the page is
 * open, and the share is not the banner's to choose: it wraps to the width it
 * is given, in the language it is given, at the text size the Commander set. A
 * German command bar at a doubled text size is five rows tall, and on a tablet
 * held in landscape that is more than half the window — chrome sitting over the
 * screen's own controls, which is exactly what shell chrome may not do at 200%
 * text (application shell, "Compact/zoom composition"; FR-011).
 *
 * So the banner keeps its place only while what it leaves below is still a
 * viewport something can be stacked in. Past that it releases and travels with
 * the page, which is the same answer a short viewport already gets in CSS —
 * this is that rule with the Commander's text size in it, which a media query
 * cannot have.
 *
 * And while it does keep its place, what it leaves below is what every sticky
 * region under it has to clear. The declared `--ednb-layout-bar-height` is the
 * banner's two decks' own heights added together, which is what they come to at
 * every width where neither wraps — but a command bar that has wrapped is
 * taller, by however many rows a longer language, a narrower window or a larger
 * text size cost it.
 * A region offsetting by the declared figure there freezes itself *behind* the
 * bar and stands its own foot short of the screen's by the difference
 * (Commander request 2026-08-25).
 *
 * Measured rather than declared, because no query can ask how tall a bar
 * wrapped to. It is the same trade the outfitting region makes for its own
 * composition, and it is made here for the same reason.
 */
export function observeBanner(
  banner: Signal<ElementRef<HTMLElement> | undefined>,
): BannerMeasurement {
  const released = signal(false);
  const height = signal<number | null>(null);
  // The window through the document rather than the bare global, as
  // `element-size.adapter.ts:28` reads it. The build's renderer has a document
  // and no window, and a bare `window.innerHeight` there is a reference error
  // rather than a missing measurement.
  const view = inject(DOCUMENT).defaultView;
  // Whether the first render has happened. Until it has there is nothing
  // truthful to read: in a browser the host is not laid out yet, and in the
  // build's renderer it never will be.
  let rendered = false;

  const measure = (): void => {
    const element = banner()?.nativeElement;
    if (!rendered || element === undefined || view === null) {
      return;
    }
    const drawn = element.getBoundingClientRect().height;
    height.set(drawn);
    released.set(view.innerHeight - drawn < stackableMinimum());
  };

  // Deferred to the first render rather than taken in the effect below, the way
  // `bench-composition.ts:91-94` defers its own first reading.
  //
  // Two reasons, and the second is why this is not optional. In a browser the
  // effect runs before the host is laid out, so a reading taken there is a
  // reading of a box the stylesheet has not finished with. And in the build's
  // renderer `afterNextRender` never runs at all, which is exactly right: a
  // document must carry no measurement, because the build cannot make one.
  // `getBoundingClientRect` is not even a function under the renderer's DOM
  // emulation — an unguarded call threw there four times per document during
  // the spike, swallowed by the prerenderer, exiting 0 with every document
  // rendered from a broken pass (015 research decision 6).
  //
  // So `released` and `height` keep their initial `false` and `null` through
  // the build, `AppFrame` publishes neither host binding into the document
  // (`app-frame.ts:185-186`), the token layer's declared height stands, and the
  // browser supplies both after it has painted. Nothing in a generated document
  // states a measurement nobody took (015/FR-009).
  //
  // Here rather than inside the effect because it needs an injection context,
  // which an effect's body is not (NG0203).
  afterNextRender(() => {
    rendered = true;
    measure();
  });

  effect((onCleanup) => {
    const element = banner()?.nativeElement;
    if (element === undefined || view === null) {
      return;
    }

    // A host that arrives after the first render — a bar that was not drawn
    // and now is — has never been measured, so read it now rather than waiting
    // for a resize that may never come.
    measure();

    // Two independent movements, and neither reports the other: the bar's own
    // height changes when it wraps — a longer language, a narrower window, a
    // larger text size — and the space it is taking a share of changes when the
    // window does.
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      observer.observe(element);
      onCleanup(() => observer.disconnect());
    }

    view.addEventListener('resize', measure, { passive: true });
    onCleanup(() => view.removeEventListener('resize', measure));
  });

  return { released: released.asReadonly(), height: height.asReadonly() };
}
