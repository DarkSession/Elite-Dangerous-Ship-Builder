import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import type { GameTextPresentation } from '../../../i18n/game-text.presenter';
import { MessageService } from '../../../i18n/message.service';
import { relationId } from '../../a11y/text-equivalence';
import { GameText } from '../game-text/game-text';
import { UnavailableValue } from '../unavailable-value/unavailable-value';

/** One hull, as the catalogue shows it. Text only; already localized. */
export interface HullSummary {
  readonly symbol: string;
  readonly name: GameTextPresentation;
  readonly manufacturer: GameTextPresentation;
  /** The short landing-pad code, or `null` when the package has none. */
  readonly size: string | null;
  /** The same class in words, for readers the code tells nothing. */
  readonly sizeText: string | null;
  /** The mount code the record shows: "2H 2L 1M 2S". */
  readonly hardpoints: string;
  /** The same mounts in words, for readers the code tells nothing. */
  readonly hardpointsText: string;
  /** The retail price in Mcr, or `null` when the package reports none. */
  readonly price: string | null;
  readonly selected: boolean;
}

/**
 * One hull as the reference's compact record (canvas 1b `.sm-row`).
 *
 * A definition list, because that is the relationship: each label names a fact
 * and each value is that fact. The reference compresses the labels away and the
 * codes down — so the labels and the spelled-out values are still here, hidden
 * from the eye rather than dropped, and the row looks exactly as it is drawn.
 *
 * Selection is carried by `aria-current` as well as by the amber marker the
 * reference uses. The marker is the fast signal for anyone who can see it; the
 * state is the only signal for everyone else.
 */
@Component({
  selector: 'ednb-hull-summary-card',
  imports: [GameText, UnavailableValue],
  templateUrl: './hull-summary-card.html',
  styleUrl: './hull-summary-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HullSummaryCard {
  readonly #messages = inject(MessageService);

  readonly hull = input.required<HullSummary>();

  readonly opened = output<string>();

  readonly cardId = relationId('hull-card');

  readonly nameLabel = this.#messages.messageSignal('catalogue.column.ship');
  readonly sizeLabel = this.#messages.messageSignal('catalogue.column.size');
  readonly priceLabel = this.#messages.messageSignal('catalogue.column.price');
  readonly priceUnit = this.#messages.messageSignal('catalogue.price.unit');
  readonly selectedLabel = this.#messages.messageSignal('catalogue.selected');

  readonly current = computed(() => (this.hull().selected ? 'true' : null));

  /** What activating the name does, in words, for its accessible name. */
  readonly openActionLabel = computed(() =>
    this.#messages.message('catalogue.open-hull', {
      hull: this.hull().name.text ?? this.hull().symbol,
    }),
  );
}
