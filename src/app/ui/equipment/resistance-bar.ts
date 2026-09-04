import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * One resistance, as a signed figure over a bar the figure does not need.
 *
 * The equipment canvas draws resistances as signed percentage bars in two
 * groups; the ship side states resistances as table figures and has no bar, so
 * this is one new component rather than a chart drawn inside the bench
 * (013 design/equipment-bench.md, "What it composes from").
 *
 * **The bar is decoration.** The figure beside it carries the sign and the
 * magnitude, and it is what a reader is given: a resistance can go either way,
 * and a Commander who cannot see the colour or the length still reads `-50%`.
 * The bar is hidden from the accessibility tree for that reason — announced, it
 * would be one figure stated twice (constitution V).
 */
@Component({
  selector: 'edsb-resistance-bar',
  templateUrl: './resistance-bar.html',
  styleUrl: './resistance-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResistanceBar {
  /** What the resistance is against, already localized. */
  readonly label = input.required<string>();

  /** The figure, already formatted with its sign for the active locale. */
  readonly value = input.required<string>();

  /** How far the bar runs, as a fraction of full. */
  readonly magnitude = input(0);

  /** True where the resistance increases damage taken rather than reducing it. */
  readonly negative = input(false);

  /** The bar's own width, clamped to the track it is drawn in. */
  readonly width = computed(() => `${Math.min(100, Math.max(0, this.magnitude() * 100))}%`);
}
