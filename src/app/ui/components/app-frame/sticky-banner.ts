import { effect, signal, type ElementRef, type Signal } from '@angular/core';
import { stackableMinimum } from '../../short-viewport';

/**
 * Whether the banner has to hand the top of the screen back.
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
 * Measured rather than declared, because no query can ask how tall a bar
 * wrapped to. It is the same trade the outfitting region makes for its own
 * composition, and it is made here for the same reason.
 */
export function observeBannerRelease(
  banner: Signal<ElementRef<HTMLElement> | undefined>,
): Signal<boolean> {
  const released = signal(false);

  effect((onCleanup) => {
    const element = banner()?.nativeElement;
    if (element === undefined) {
      return;
    }

    const measure = (): void => {
      const left = window.innerHeight - element.getBoundingClientRect().height;
      released.set(left < stackableMinimum());
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

  return released.asReadonly();
}
