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
  /**
   * Which way the recipe moved this figure, for the reader who can see the
   * colour and the one who cannot. `null` where there is nothing to compare.
   */
  readonly direction?: 'better' | 'worse' | 'unchanged' | null;
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
 * The canvas's green and red deltas and its ▲/▼ markers are here. Which way is
 * better is not read off the Almanac — its `LessIsGood` is documented as
 * unreliable — but off this application's own table beside the attributes it
 * compares, exactly as the canvas assigns it. Never colour alone: the marker
 * is drawn beside the figure and the direction is spoken in words.
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

  /** The direction, in words, for a reader who cannot see the colour. */
  directionLabel(direction: 'better' | 'worse'): string {
    return this.#messages.message(
      direction === 'better'
        ? 'outfitting.engineering.attributes.better'
        : 'outfitting.engineering.attributes.worse',
    );
  }
}
