import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** What closes the body above the footer, where anything does. */
export type LayerFooterRule = 'none' | 'section' | 'quiet';

/**
 * A layer's closing row: what the layer has to say on the leading edge, and
 * what it offers on the trailing one.
 *
 * A component of its own rather than a slot on `Layer`, because two of its
 * callers project a whole region into the layer's body and draw their footer
 * inside that region, where a slot on the layer cannot reach.
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

  readonly classes = computed(() => `footer footer--rule-${this.rule()}`);
}
