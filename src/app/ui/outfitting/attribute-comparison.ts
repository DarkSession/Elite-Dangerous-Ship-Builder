import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MessageService } from '../../i18n/message.service';
import { relationId } from '../a11y/text-equivalence';

/** One attribute, as the catalogue has it and as the draft would make it. */
export interface AttributeComparisonRow {
  /** A stable key for tracking. Never rendered. */
  readonly key: string;
  /** The application's own localized name for the package field. */
  readonly label: string;
  /** Formatted for the active locale, or `null` where the package has none. */
  readonly stock: string | null;
  readonly modified: string | null;
}

/**
 * What the selected engineering would change, side by side.
 *
 * Canvas 1c heads two columns `STOCK` and `MODIFIED` and canvas 1d writes
 * `STOCK → MODIFIED`. Both the columns and what they hold are the reference's:
 * the module's catalogue record, and what the selection would make of it. That
 * is also the pair the game's own engineering panel shows, so a Commander
 * comparing the two screens is comparing the same two numbers.
 *
 * The canvas's green and red deltas and its ▲/▼ markers are not here. A
 * direction is a claim about which way is better, the Almanac documents its own
 * `LessIsGood` as unreliable, and nothing else publishes that semantics — so
 * deriving one would be this application inventing game meaning (FR-007,
 * engineering editor design, "Attribute and cost honesty").
 *
 * A table, with the attribute names as row headers, so a reader gets "Damage,
 * current, 5.72" rather than three loose numbers whose meaning is their column
 * position.
 */
@Component({
  selector: 'edsb-attribute-comparison',
  templateUrl: './attribute-comparison.html',
  styleUrl: './attribute-comparison.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeComparison {
  readonly #messages = inject(MessageService);

  readonly rows = input.required<readonly AttributeComparisonRow[]>();

  readonly captionId = relationId('attribute-comparison');

  readonly caption = this.#messages.messageSignal('outfitting.engineering.attributes.legend');
  readonly attributeColumn = this.#messages.messageSignal(
    'outfitting.engineering.attributes.attribute',
  );
  readonly stockColumn = this.#messages.messageSignal('outfitting.engineering.attributes.stock');
  readonly modifiedColumn = this.#messages.messageSignal(
    'outfitting.engineering.attributes.modified',
  );
  readonly unavailable = this.#messages.messageSignal('game-text.unavailable');
}
