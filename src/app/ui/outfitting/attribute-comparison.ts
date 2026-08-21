import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MessageService } from '../../i18n/message.service';
import { relationId } from '../a11y/text-equivalence';

/** One attribute, as it is now and as the draft would make it. */
export interface AttributeComparisonRow {
  /** A stable key for tracking. Never rendered. */
  readonly key: string;
  /** The application's own localized name for the package field. */
  readonly label: string;
  /** Formatted for the active locale, or `null` where the package has none. */
  readonly current: string | null;
  readonly candidate: string | null;
}

/**
 * What the selected engineering would change, side by side.
 *
 * Canvas 1c heads two columns `STOCK` and `MODIFIED` and canvas 1d writes
 * `STOCK → MODIFIED`. The columns are drawn as the canvas draws them; what they
 * hold is the *current* module against the *candidate*, because that is the
 * question an editor with an unapplied draft is answering — and it is what the
 * accepted design and task both specify. The headings say so rather than
 * carrying the canvas's words over a different pair of numbers.
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
  readonly currentColumn = this.#messages.messageSignal(
    'outfitting.engineering.attributes.current',
  );
  readonly candidateColumn = this.#messages.messageSignal(
    'outfitting.engineering.attributes.candidate',
  );
  readonly unavailable = this.#messages.messageSignal('game-text.unavailable');
}
