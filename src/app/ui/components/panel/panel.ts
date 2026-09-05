import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { relationId } from '../../a11y/text-equivalence';

/** How much the panel separates itself from the page. */
export type PanelElevation = 'flat' | 'raised';

/**
 * A named region of content.
 *
 * The heading is what makes it a landmark worth navigating to: a `region` with
 * no accessible name is announced as an unnamed group, which is worse than not
 * being a region at all. The caller supplies the heading level so the panel
 * fits the document outline it is placed into rather than imposing one.
 */
@Component({
  selector: 'ednb-panel',
  templateUrl: './panel.html',
  styleUrl: './panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Panel {
  readonly heading = input.required<string>();

  /** Heading level, so the panel nests correctly in the surrounding outline. */
  readonly headingLevel = input<2 | 3 | 4 | 5 | 6>(2);

  readonly description = input<string | null>(null);
  readonly elevation = input<PanelElevation>('flat');

  readonly headingId = relationId('panel-heading');
  readonly descriptionId = relationId('panel-description');
}
