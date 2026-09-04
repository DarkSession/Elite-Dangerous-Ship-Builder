import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MessageService } from '../../../i18n/message.service';
import { relationId } from '../../a11y/text-equivalence';

/** Why there is no value. The two are genuinely different states. */
export type UnavailableKind = 'unavailable' | 'incomplete';

/**
 * The absence of a value, stated.
 *
 * This component exists because of one rule: never fabricate a value
 * (constitution IV). Where the Almanac reports a value as unavailable or a
 * build as incomplete, that is what a Commander is shown — not a zero, not a
 * dash, not an estimate. A zero is a number someone might act on; "unavailable"
 * is the truth.
 *
 * `incomplete` and `unavailable` stay distinct: a build missing a module has a
 * value that could exist, while an unavailable one has no value to give.
 */
@Component({
  selector: 'ednb-unavailable-value',
  templateUrl: './unavailable-value.html',
  styleUrl: './unavailable-value.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnavailableValue {
  readonly #messages = inject(MessageService);

  readonly kind = input<UnavailableKind>('unavailable');

  /** Why, in the Commander's language, when a reason is known. */
  readonly reason = input<string | null>(null);

  /** What the missing value would have been. Gives the absence context. */
  readonly label = input<string | null>(null);

  readonly reasonId = relationId('unavailable-reason');

  readonly text = computed(() => {
    const reason = this.reason();
    if (this.kind() === 'incomplete') {
      return this.#messages.message('incomplete.value');
    }
    return reason
      ? this.#messages.message('unavailable.with-reason', { reason })
      : this.#messages.message('unavailable.value');
  });
}
