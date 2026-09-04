import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { WaitingMark } from './waiting-mark';

/** The widths a run of bars takes, in order and then again from the start. */
const BAR_WIDTHS = [100, 94, 72, 86] as const;

/**
 * The shape of content that has not arrived.
 *
 * Drawn where the content will be, so a region that is about to hold a screen
 * holds its room instead of collapsing and then pushing everything below it
 * down when the chunk lands (011/FR-029).
 *
 * The bars are hidden from a reader and the sentence is not. The block is a
 * `status`, so a Commander who cannot see the bars is told the screen is
 * loading rather than told nothing.
 *
 * It carries no `aria-busy`. A live region marked busy is a region an assistive
 * technology holds back until the busy flag drops, and this region is only ever
 * drawn while the wait is on — so the flag that describes it is the flag that
 * suppresses the one announcement it exists to make.
 *
 * The bars do not move. The mark above them is the whole of the motion here,
 * which is one animation to still rather than one for every bar, and a bar that
 * pulsed would be a second thing saying what the mark already says.
 */
@Component({
  selector: 'ednb-skeleton',
  imports: [WaitingMark],
  templateUrl: './skeleton.html',
  styleUrl: './skeleton.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Skeleton {
  /** What is on its way, in words. Read aloud; never drawn. */
  readonly label = input.required<string>();

  /** How many bars stand for the content. */
  readonly lines = input(3);

  /**
   * The bars, as widths.
   *
   * A fixed cycle rather than a random run: a skeleton that renders differently
   * on each pass is a screenshot nobody can compare and a test nobody can pin.
   */
  readonly bars = computed(() =>
    Array.from(
      { length: Math.max(1, this.lines()) },
      (_unused, index) => BAR_WIDTHS[index % BAR_WIDTHS.length] ?? 100,
    ),
  );
}
