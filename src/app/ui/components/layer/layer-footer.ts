import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** What closes the body above the footer, where anything does. */
export type LayerFooterRule = 'none' | 'section' | 'quiet';

/** How far apart the answers on the trailing edge stand. */
export type LayerFooterSpacing = 'tight' | 'inline';

/**
 * A layer's closing row: what the layer has to say on the leading edge, and
 * what it offers on the trailing one.
 *
 * A component of its own rather than a slot on `Layer`, because two of its
 * callers draw the footer inside a component of their own. A slot on the layer
 * cannot reach into another component's template.
 *
 * The row wraps rather than clipping. At 200% text the message and the actions
 * stack instead of pushing each other past the edge of the panel.
 */
@Component({
  selector: 'ednb-layer-footer',
  templateUrl: './layer-footer.html',
  styleUrl: './layer-footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerFooter {
  /**
   * The hairline above the row.
   *
   * Three values because the callers close their bodies differently: one on the
   * section rule, one on the decorative hairline, and one on nothing at all
   * because the region above it already ends in a panel edge.
   */
  readonly rule = input<LayerFooterRule>('none');

  /**
   * The gap between the answers.
   *
   * Two values because the layers draw them at two widths: the exchange layers
   * set a pair of answers close together, and the save layer sets its own at the
   * inline measure.
   */
  readonly spacing = input<LayerFooterSpacing>('tight');

  readonly classes = computed(() => `footer footer--rule-${this.rule()} footer--${this.spacing()}`);
}
