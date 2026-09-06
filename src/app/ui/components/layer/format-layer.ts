import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Layer } from './layer';

/**
 * A layer split into a list of formats and the chosen format's content.
 *
 * Two regions divided by one hairline that runs from under the title bar to the
 * foot of the panel, and one flow below the medium breakpoint where the list
 * becomes a strip above the content. The layer's body is flush, so each region
 * carries its own padding and the rule has a full height to run.
 *
 * The shell is here because two capabilities draw it: passing a build on and
 * passing a loadout on are the same arrangement with different formats in it.
 * What each format holds is each feature's own (011/FR-001).
 *
 * The content region has one height for every format. A payload of twelve rows
 * and a link of one line must not move the panel under the hand that chose
 * between them, so the region carries a floor. A floor and not a cap: a refusal
 * is a state of the panel and still grows it.
 */
@Component({
  selector: 'ednb-format-layer',
  imports: [Layer],
  templateUrl: './format-layer.html',
  styleUrl: './format-layer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormatLayer {
  /** The layer's visible title. */
  readonly title = input.required<string>();

  readonly open = input(false);

  /** The dismiss control's visible label. */
  readonly dismissLabel = input.required<string | null>();

  readonly dismissed = output<void>();
}
