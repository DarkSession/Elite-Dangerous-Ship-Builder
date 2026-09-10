import {
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  signal,
  type Signal,
} from '@angular/core';
import { SHORT_VIEWPORT } from '../short-viewport';

/**
 * Which of the equipment canvas's two artboards the bench is drawn as.
 *
 * `wide` is artboard `1a` — the ledger, the item view and the commander column
 * side by side. `compact` is artboard `1b` — three tabs, with the item view as a
 * drill-in from a ledger row. Everything between the two widths is one fluid
 * layout, and neither artboard's width is a breakpoint to pin.
 */
export type BenchComposition = 'wide' | 'compact';

/**
 * The declared content minimums, in rem, added up.
 *
 * The ledger's rail and the commander rail are the canvas's own fixed tracks —
 * 392px and 320px in artboard `1a` — and the item view between them takes the
 * rest. Stated in rem so a Commander who has doubled their text size gets the
 * compact composition for the same reason a narrow window does.
 *
 * The item column's share is the medium container step, which is the step the
 * item view and the suit gate answer at from inside that column. Below it the
 * two disagree with each other: the gate draws canvas 2a's header because the
 * bench composes wide, and the item view draws canvas 1b's band because its own
 * column is narrow, so choosing the first suit moves the list it was chosen from
 * (019/FR-001). Stated at one step, a wide bench never draws a middle column
 * narrower than that column's own stylesheets ask for.
 *
 * The rules are the two hairlines the grid shows between the three columns. They
 * are a rem token like everything else here, so the sum holds at any text size.
 *
 * `_responsive.scss` composes the same figure for the grid it draws
 * (`$equipment-bench-wide-min`). The two are the same decision asked from two
 * sides, and they may not drift.
 */
const LEDGER_REM = 24.5;
const ITEM_REM = 24;
const COMMANDER_REM = 20;
const RULES_REM = 0.125;
export const BENCH_WIDE_MINIMUM_REM = LEDGER_REM + ITEM_REM + COMMANDER_REM + RULES_REM;

/**
 * Watches the bench's own box, not the viewport.
 *
 * The same reasoning the ship workspace records: the same region inside a
 * narrower shell, at 400% zoom or beside expanded text has less room and should
 * compose accordingly. Height is the one part that is genuinely the viewport's,
 * and it is read through the stylesheets' own query so CSS and this decision
 * cannot disagree.
 *
 * Most of the arrangement is CSS container queries, which need none of this.
 * What needs it is the one decision CSS cannot make: whether the item view is a
 * third column or a drill-in that replaces the ledger.
 */
export function observeBenchComposition(): Signal<BenchComposition> {
  const host = inject(ElementRef<HTMLElement>).nativeElement;
  const composition = signal<BenchComposition>('compact');
  const short = typeof matchMedia === 'function' ? matchMedia(SHORT_VIEWPORT) : null;
  let width = 0;

  const measure = (): void => {
    if (short?.matches === true) {
      composition.set('compact');
      return;
    }
    // Read the root size each time, so a text-scale change moves the threshold
    // with it rather than leaving it at load-time pixels.
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    composition.set(width / rem >= BENCH_WIDE_MINIMUM_REM ? 'wide' : 'compact');
  };

  short?.addEventListener('change', measure);
  inject(DestroyRef).onDestroy(() => short?.removeEventListener('change', measure));

  if (typeof ResizeObserver === 'undefined') {
    // A renderer without the observer gets the compact composition, which is
    // the one that carries every region in the least space.
    return composition.asReadonly();
  }

  const observer = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (entry !== undefined) {
      width = entry.contentRect.width;
      measure();
    }
  });
  observer.observe(host);

  // Measured as soon as the host is in the document rather than only when the
  // observer first reports. The observer's first delivery is a frame away, and
  // until then the signal holds its initial `compact` — so a wide bench renders
  // its tab strip once and takes it away again, which is a control that exists
  // for a frame and a layout that has to be re-arranged after being built.
  afterNextRender(() => {
    width = host.getBoundingClientRect().width;
    measure();
  });

  inject(DestroyRef).onDestroy(() => observer.disconnect());

  return composition.asReadonly();
}
