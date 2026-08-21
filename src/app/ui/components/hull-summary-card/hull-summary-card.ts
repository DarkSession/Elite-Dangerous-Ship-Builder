import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import type { GameTextPresentation } from '../../../i18n/game-text.presenter';
import { MessageService } from '../../../i18n/message.service';
import { relationId } from '../../a11y/text-equivalence';
import { ActionButton } from '../action/action-button';
import { GameText } from '../game-text/game-text';
import { UnavailableValue } from '../unavailable-value/unavailable-value';

/** One hull, as the catalogue shows it. Text only; already localized. */
export interface HullSummary {
  readonly symbol: string;
  readonly name: GameTextPresentation;
  readonly manufacturer: GameTextPresentation;
  /** The landing-pad class in words, or `null` when the package has none. */
  readonly size: string | null;
  /** The hardpoint layout as a sentence. */
  readonly hardpoints: string;
  /** The formatted retail price, or `null` when the package reports none. */
  readonly price: string | null;
  readonly selected: boolean;
}

/**
 * One hull as a stacked record.
 *
 * A definition list, because that is the relationship: each label names a fact
 * and each value is that fact. A grid of divs would show the same words and
 * tell a reader nothing about which value belongs to which label.
 *
 * Selection is carried by visible text and `aria-current` as well as by the
 * amber marker the design uses. The marker is the fast signal for anyone who
 * can see it; the text is the only signal for everyone else (FR-010).
 */
@Component({
  selector: 'edsb-hull-summary-card',
  imports: [ActionButton, GameText, UnavailableValue],
  templateUrl: './hull-summary-card.html',
  styleUrl: './hull-summary-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HullSummaryCard {
  readonly #messages = inject(MessageService);

  readonly hull = input.required<HullSummary>();

  /** The visible label of the action that opens this hull. */
  readonly openLabel = input.required<string>();

  readonly opened = output<string>();

  readonly cardId = relationId('hull-card');

  readonly manufacturerLabel = this.#messages.messageSignal('catalogue.column.manufacturer');
  readonly sizeLabel = this.#messages.messageSignal('catalogue.column.size');
  readonly hardpointsLabel = this.#messages.messageSignal('catalogue.column.hardpoints');
  readonly priceLabel = this.#messages.messageSignal('catalogue.column.price');
  readonly selectedLabel = this.#messages.messageSignal('catalogue.selected');

  readonly current = computed(() => (this.hull().selected ? 'true' : null));
}
