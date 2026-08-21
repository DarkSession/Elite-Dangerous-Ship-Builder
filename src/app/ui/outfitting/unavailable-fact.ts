import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MessageService } from '../../i18n/message.service';
import { UnavailableValue } from '../components/unavailable-value/unavailable-value';

/**
 * One package fact, whether or not the package has one.
 *
 * The reference draws facts as a tracked mono label above a mono value —
 * `SPEED m/s`, `MASS t`, `PWR MW`. What it never draws is the case this
 * component exists for: the package returning `null`, or a module record simply
 * not carrying that field. The rule for both is the same and is not negotiable,
 * so it lives in one place: say the value is unavailable, in words, and never
 * write a zero where the Almanac wrote nothing (constitution IV, FR-003).
 *
 * `value` is already formatted for the active locale. Deciding precision is the
 * caller's job, not a presentation component's.
 */
@Component({
  selector: 'edsb-unavailable-fact',
  imports: [UnavailableValue],
  templateUrl: './unavailable-fact.html',
  styleUrl: './unavailable-fact.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnavailableFact {
  readonly #messages = inject(MessageService);

  /** What is being reported. Always drawn, present or absent. */
  readonly label = input.required<string>();

  /** The formatted value, or `null` when the package has none. */
  readonly value = input<string | null>(null);

  /** The unit, or the rating marker where a figure has none. */
  readonly unit = input<string | null>(null);

  /** Why there is no value, when something more specific can be said. */
  readonly reason = input<string | null>(null);

  readonly available = computed(() => {
    const value = this.value();
    return value !== null && value.length > 0;
  });

  /** The framing shown beside an absence when the caller offered no reason. */
  readonly defaultReason = computed(() =>
    this.#messages.message('outfitting.fact.unavailable.reason'),
  );
}
