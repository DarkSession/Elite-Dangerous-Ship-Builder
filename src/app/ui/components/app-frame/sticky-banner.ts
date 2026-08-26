import { effect, signal, type ElementRef, type Signal } from '@angular/core';
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
 * region under it has to clear. The declared `--edsb-layout-bar-height` is one
 * row of controls at the target baseline, which is what the bar comes to on
 * every screen that draws a plain title — but not on the workspace, whose
 * identity block is two 24px targets and a gap, and not on any width where the
 * bar has wrapped. A region offsetting by the declared figure there freezes
 * itself *behind* the bar and stands its own foot short of the screen's by the
 * difference (Commander request 2026-08-25).
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

  effect((onCleanup) => {
    const element = banner()?.nativeElement;
    if (element === undefined) {
      return;
    }

    const measure = (): void => {
      const drawn = element.getBoundingClientRect().height;
      height.set(drawn);
      released.set(window.innerHeight - drawn < stackableMinimum());
    };

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

    window.addEventListener('resize', measure, { passive: true });
    onCleanup(() => window.removeEventListener('resize', measure));
  });

  return { released: released.asReadonly(), height: height.asReadonly() };
}
